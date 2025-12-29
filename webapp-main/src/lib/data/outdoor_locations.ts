/**
 * Outdoor climbing location data
 * Structure: Area -> Crag -> (Sector/Wall is text input)
 */

export interface OutdoorLocationData {
    [area: string]: {
        [crag: string]: string[];
    };
}

export const OUTDOOR_LOCATIONS: OutdoorLocationData = {
    Portland: {
        'Blacknor Far North': [
            'Far North (Pit Prop Crag - North Wing)',
            'Far North (Pit Prop Crag - South Wing)',
            'Sunstone Wall',
            'Sandcastle Wall',
            'Hidden Wall'
        ],
        'Blacknor North': [
            'Diamond Slab',
            'The Ledge',
            "Sharpy's Wall",
            'Reptile Smile Area',
            'Wolfgang Forever Area',
            'Captain Klutz Area',
            'Death of Cool Area',
            'Seattle Be The Day Area',
            'Blacknor Heights (Blacknor Quarry Bouldering)',
            'Blacknor Fort Quarry (Sport)',
            'Cliff Top Way Down'
        ],
        'Blacknor Central': [
            'The Veranda',
            'Medusa Wall',
            'The Battlement',
            'Wave Wall',
            'Mirror Wall'
        ],
        'Blacknor South': [
            'Fallen Slab',
            'Infidel Slab',
            'Englands Dreaming Area',
            'Sacred Angel Area',
            'The Reach',
            'Shit Happens Wall'
        ],
        'Blacknor Far South': [
            "Deadman's Bay",
            'The White Hole',
            'Wall of Lament'
        ],
        'Battleship Edge': ['Northern Sector', 'Main Edge', 'Battleship Block'],
        'Battleship Back Cliff': ['Zinc Oxide Mountain', 'The Main Cliff', 'Sleepy Hollow'],
        'Wallsend North': ['Sweet Smell of Success Wall', 'The Coastguard Wall (Northern section)'],
        'Wallsend South': ['The Upper Tier', 'The Lower Tier', "Stalker's Zone"],
        'Coastguard North': ['Top Tier', 'Main Cliff (Beeston Bump)', 'The Grooves'],
        'Coastguard South': ['The White Wall', 'Tennessee Wall', 'The Veranda (South)'],
        Godnor: ['Godnor North', 'Godnor Far South', 'The Godnor Gate Area'],
        Neddyfields: ['Neddyfields Main Wall', 'The Flowstone Wall', 'Neddyfields Bouldering'],
        'Cheyne Cliff': ['Red Wall', 'Inception Wall', 'Road Rage Wall', 'The Nook', 'The Block'],
        'The Cuttings': ['The Cuttings (Main Cliff)', 'The Pulpit', 'The Bower', "Sun Lover's Slab"],
        'The New Cuttings': ['The Gallery', 'The Annex', 'The Arches', 'The Grotto'],
        'The Cuttings Boulderfield': ['The Tractor', 'The Coffin', 'The Octagon', 'Lightning Wall']
    },
    Swanage: {
        'Dancing Ledge': ['The Amphitheatre', 'The Upper Tier', 'The Skull', 'Promenade', 'The Quarry'],
        Hedbury: ['Hedbury Quarry (Main)', 'Hedbury Sea Cliff (The Big Wall)'],
        Winspit: ['The West Quarry', 'The East Quarry (The Playground)', 'The Sea Walls']
    },
    'Wye Valley': {
        'Ban-y-Gor': ['The Main Wall', 'The River Wall', 'The Far Left', 'The Upper Tier'],
        'Biblins Cave': ['The Main Cave', 'The Right Wall', 'The Entrance Area'],
        'Woodcroft Quarry': ['Fly Wall', 'The Main Quarry', 'The Retaining Wall'],
        'Wyndcliff Quarry': ['The Main Wall (Left & Right)', 'The Upper Tier', 'The Shady Wall']
    },
    'Costa Del Severn': {
        Brean: ['Boulder Cove', 'The River Face (Main Cliff)', 'The Fort', 'The Slab'],
        Clevedon: ['Ladye Bay', 'Marine Lake (Bouldering)', 'The Sea Walls'],
        'Portishead Quarry': ['The Main Wall', 'The Slab', 'The Upper Tier']
    },
    Bristol: {
        'Avon Gorge': [
            'Sea Walls',
            'Suspension Bridge Buttress',
            'Morning Slab',
            'Main Wall',
            'New Quarry',
            'The Amphitheatre',
            'Unknown Wall'
        ],
        'Leigh Woods': ['Quarry 1', 'Quarry 2', 'The Main Buttress'],
        'Bickley Wood': ['The Main Wall', 'The Stream Wall'],
        Hambrook: ['The Roadside Wall']
    },
    Cotswolds: {
        'Sally-in-the-Wood': ['The Main Edge', 'The Boulders'],
        'Browns Folly': ['The Tower', 'The Main Wall', 'The Upper Wall', 'The Far Right']
    },
    Mendips: {
        'Cheddar Gorge': [
            'High Rock',
            'Sunset Buttress',
            'Lion Rock',
            'The Pinnacles',
            'Acid Rock',
            'Coronation Street',
            'Long Rock'
        ]
    },
    Gower: {
        Rhossili: ['Shipwreck Cove', 'Rhossili Upper Cliff', 'The Tears Point'],
        'Trial Wall Area': ['Trial Wall', 'The Terraces'],
        Foxhole: ['The Main Cave', 'The Slab', 'The Overhangs']
    },
    'South Wales': {
        'Dinas Rock': ['Kennelgarth Wall', 'Main Overhang', 'Roadside Crag', 'The Inland Slabs'],
        Ogmore: ['The Deep Zawn', "Hardy's Bay", 'The Diamond', 'Daytona Wall']
    },
    'North Wales': {
        'Cromlech (Dinas Cromlech)': ['The Corner (Cenotaph)', 'Left Wall', 'Right Wall'],
        'Australia (Slate Quarries)': ['The Sidings', 'Looning the Tube Area', "Dali's Hole", 'The Salt Pans']
    },
    'Peak District': {
        'Burbage South Valley': ['The Boulders', 'The Edge (The Alliance Area)', 'The Tank'],
        'Gardoms Edge': ['Apple Buttress', 'The Eye of Faith', 'Moomin Buttress'],
        'Raven Tor': ['The Main Wall', 'The Weedkiller Wall'],
        Stanage: ['Popular End', 'Plantation', 'High Neb', 'Stanage North', 'The End', 'Stanage Far North'],
        'Curbar Edge': ['The Main Edge', 'Elder Crack Area']
    },
    Devon: {
        Dartmoor: ['Haytor (Low Man)', 'Hound Tor', 'The Dewerstone (Main Cliff)', 'Bonehill Rocks'],
        Hartland: ['Screda Point', 'Smoothlands', 'Blackchurch Rock'],
        Tintagel: ['The Great Cliff', 'Gull Rock', "Ila's Ledge"]
    }
};

// Helper to get list of areas
export function getAreas(): string[] {
    return Object.keys(OUTDOOR_LOCATIONS);
}

// Helper to get crags for an area
export function getCrags(area: string): string[] {
    if (!OUTDOOR_LOCATIONS[area]) return [];
    return Object.keys(OUTDOOR_LOCATIONS[area]);
}

// Helper to get sectors for a crag
export function getSectors(area: string, crag: string): string[] {
    if (!OUTDOOR_LOCATIONS[area] || !OUTDOOR_LOCATIONS[area][crag]) return [];
    return OUTDOOR_LOCATIONS[area][crag];
}
