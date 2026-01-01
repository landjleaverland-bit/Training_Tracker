
import zipfile
import xml.etree.ElementTree as ET
import json
import sys
import os

def parse_shared_strings(zf):
    try:
        with zf.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            # Namespace
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            strings = []
            for si in root.findall('main:si', ns):
                t = si.find('main:t', ns)
                if t is not None:
                    strings.append(t.text)
                else:
                    # Handle rich text or other cases if needed, but usually 't' is there
                    strings.append("")
            return strings
    except KeyError:
        return []

def parse_styles(zf):
    try:
        with zf.open('xl/styles.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            
            # Fills
            fills = []
            for fill in root.findall('main:fills/main:fill', ns):
                patternFill = fill.find('main:patternFill', ns)
                if patternFill is not None:
                    fgColor = patternFill.find('main:fgColor', ns)
                    if fgColor is not None:
                        rgb = fgColor.get('rgb')
                        theme = fgColor.get('theme')
                        tint = fgColor.get('tint')
                        fills.append({'rgb': rgb, 'theme': theme, 'tint': tint})
                    else:
                        fills.append(None)
                else:
                    fills.append(None)
            
            # CellXfs (map to fills)
            xfs = []
            for xf in root.findall('main:cellXfs/main:xf', ns):
                fillId = int(xf.get('fillId', 0))
                xfs.append(fillId)
                
            return {'fills': fills, 'xfs': xfs}
    except KeyError:
        return {'fills': [], 'xfs': []}

def parse_workbook(zf):
    with zf.open('xl/workbook.xml') as f:
        tree = ET.parse(f)
        root = tree.getroot()
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        sheets = []
        for sheet in root.findall('main:sheets/main:sheet', ns):
            sheets.append({
                'name': sheet.get('name'),
                'sheetId': sheet.get('sheetId'),
                'rId': sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            })
        return sheets

def main():
    filename = 'Strength Periodisation.xlsx'
    if not os.path.exists(filename):
        print(json.dumps({"error": "File not found"}))
        return

    try:
        zf = zipfile.ZipFile(filename, 'r')
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        return

    shared_strings = parse_shared_strings(zf)
    styles = parse_styles(zf)
    sheets_meta = parse_workbook(zf)
    
    # Map rId to filename
    # Need to parse _rels/.rels or xl/_rels/workbook.xml.rels
    # usually sheet rId1 maps to worksheets/sheet1.xml
    
    sheet_files = {}
    with zf.open('xl/_rels/workbook.xml.rels') as f:
        tree = ET.parse(f)
        root = tree.getroot()
        ns = {'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'}
        for relationship in root.findall('rel:Relationship', ns):
            sheet_files[relationship.get('Id')] = 'xl/' + relationship.get('Target')

    result = {}

    for sheet_meta in sheets_meta:
        sheet_name = sheet_meta['name']
        rId = sheet_meta['rId']
        xml_path = sheet_files.get(rId)
        
        if not xml_path:
            continue
            
        try:
            with zf.open(xml_path) as f:
                tree = ET.parse(f)
                root = tree.getroot()
                ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                
                # Assume headers are in the first row
                # We want to group columns by color
                
                headers = []
                
                # Find all cells in row 1
                # row 1 is usually the first row element
                rows = root.findall('main:sheetData/main:row', ns)
                if not rows:
                    continue
                    
                # Assuming first row is header
                header_row = rows[0]
                
                for cell in header_row.findall('main:c', ns):
                    # Get value
                    v_tag = cell.find('main:v', ns)
                    val = ""
                    if v_tag is not None:
                        if cell.get('t') == 's':
                            val = shared_strings[int(v_tag.text)]
                        else:
                            val = v_tag.text
                    
                    # Get style
                    s_idx = int(cell.get('s', 0))
                    fill_id = styles['xfs'][s_idx] if s_idx < len(styles['xfs']) else 0
                    fill = styles['fills'][fill_id] if fill_id < len(styles['fills']) else None
                    
                    headers.append({
                        'text': val,
                        'style': fill
                    })
                
                # Group by style
                # Create groups based on contiguous style or just style ID
                # The user said "grouped by different colours within the column headers"
                
                groups = []
                current_group = {'style': None, 'exercises': []}
                
                for h in headers:
                    style_key = json.dumps(h['style'], sort_keys=True)
                    if style_key != json.dumps(current_group['style'], sort_keys=True) and current_group['exercises']:
                        groups.append(current_group)
                        current_group = {'style': h['style'], 'exercises': []}
                    elif current_group['style'] is None: # Init
                        current_group['style'] = h['style']
                        
                    current_group['exercises'].append(h['text'])
                
                if current_group['exercises']:
                    groups.append(current_group)
                    
                result[sheet_name] = groups
                
        except Exception as e:
            result[sheet_name] = {"error": str(e)}

    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
