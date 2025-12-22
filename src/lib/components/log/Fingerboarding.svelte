<script>
    import { fade } from "svelte/transition";

    let exercises = [
        {
            id: crypto.randomUUID(),
            name: "Max hangs",
            grip_type: "Half-crimp",
            details: [{ weight: 0, reps: 5 }],
            sets: 1,
            notes: "",
        },
    ];

    export function getData() {
        return {
            location: "N/A",
            session: "Fingerboard",
            exercises,
        };
    }

    function addRow() {
        exercises = [
            ...exercises,
            {
                id: crypto.randomUUID(),
                name: "Max hangs",
                grip_type: "Half-crimp",
                details: [{ weight: 0, reps: 5 }],
                sets: 1,
                notes: "",
            },
        ];
    }

    function addDetail(/** @type {string} */ exerciseId) {
        exercises = exercises.map((ex) => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    details: [...ex.details, { weight: 0, reps: 5 }],
                };
            }
            return ex;
        });
    }

    function removeDetail(
        /** @type {string} */ exerciseId,
        /** @type {number} */ detailIndex,
    ) {
        exercises = exercises.map((ex) => {
            if (ex.id === exerciseId && ex.details.length > 1) {
                const newDetails = [...ex.details];
                newDetails.splice(detailIndex, 1);
                return { ...ex, details: newDetails };
            }
            return ex;
        });
    }

    function removeRow(/** @type {string} */ id) {
        if (exercises.length > 1) {
            exercises = exercises.filter((ex) => ex.id !== id);
        }
    }
</script>

<div class="fingerboard-config" in:fade>
    <div class="exercise-section">
        <div class="section-header">
            <h3>Sets / Exercises</h3>
            <button class="add-row-btn" on:click={addRow} title="Add Row">
                Add Row
            </button>
        </div>

        <div class="sets-container">
            {#each exercises as ex, i (ex.id)}
                <div class="set-card" in:fade>
                    <div class="set-row main">
                        <div class="input-group">
                            <label for="ex-name-{ex.id}">Exercise</label>
                            <select id="ex-name-{ex.id}" bind:value={ex.name}>
                                <option value="Max hangs">Max hangs</option>
                                <option value="Recruitment pulls"
                                    >Recruitment pulls</option
                                >
                                <option value="Max pick-ups"
                                    >Max pick-ups</option
                                >
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="ex-grip-{ex.id}">Grip</label>
                            <select
                                id="ex-grip-{ex.id}"
                                bind:value={ex.grip_type}
                            >
                                <option value="Full-crimp">Full-crimp</option>
                                <option value="Half-crimp">Half-crimp</option>
                                <option value="Three finger drag"
                                    >Three finger drag</option
                                >
                                <option value="Pinch">Pinch</option>
                                <option value="Open hand">Open hand</option>
                                <option value="Sloper">Sloper</option>
                            </select>
                        </div>
                        <button
                            class="delete-btn mobile-top"
                            on:click={() => removeRow(ex.id)}
                            title="Remove Set"
                        >
                            &times;
                        </button>
                    </div>

                    <div class="set-row metrics">
                        <div class="details-list">
                            {#each ex.details as detail, j}
                                <div class="detail-item" in:fade>
                                    <div class="input-group mini">
                                        <label for="ex-weight-{ex.id}-{j}"
                                            >Weight</label
                                        >
                                        <input
                                            id="ex-weight-{ex.id}-{j}"
                                            type="number"
                                            bind:value={detail.weight}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div class="input-group mini">
                                        <label for="ex-reps-{ex.id}-{j}"
                                            >Reps</label
                                        >
                                        <input
                                            id="ex-reps-{ex.id}-{j}"
                                            type="number"
                                            bind:value={detail.reps}
                                            placeholder="1"
                                        />
                                    </div>
                                    {#if ex.details.length > 1}
                                        <button
                                            class="remove-detail-btn"
                                            on:click={() =>
                                                removeDetail(ex.id, j)}
                                            title="Remove Detail"
                                        >
                                            &times;
                                        </button>
                                    {/if}
                                </div>
                            {/each}
                            <button
                                class="add-detail-btn"
                                on:click={() => addDetail(ex.id)}
                            >
                                + Add Weight
                            </button>
                        </div>

                        <div class="meta-section">
                            <div class="input-group mini">
                                <label for="ex-sets-{ex.id}">Sets</label>
                                <input
                                    id="ex-sets-{ex.id}"
                                    type="number"
                                    bind:value={ex.sets}
                                    placeholder="1"
                                />
                            </div>
                            <div class="input-group grow">
                                <label for="ex-notes-{ex.id}">Notes</label>
                                <input
                                    id="ex-notes-{ex.id}"
                                    type="text"
                                    bind:value={ex.notes}
                                    placeholder="Notes"
                                />
                            </div>
                            <button
                                class="delete-btn desktop-only"
                                on:click={() => removeRow(ex.id)}
                                title="Remove Set"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .exercise-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .sets-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .set-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 0.75rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .set-row {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
    }

    .set-row.main {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 1rem;
    }

    .set-row.metrics {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5rem;
    }

    .details-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .detail-item {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
    }

    .add-detail-btn {
        background: transparent;
        color: #60a5fa;
        border: 1px dashed rgba(96, 165, 250, 0.3);
        padding: 0.4rem;
        border-radius: 0.4rem;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        width: fit-content;
        transition: all 0.2s ease;
    }

    .add-detail-btn:hover {
        background: rgba(96, 165, 250, 0.05);
        border-color: rgba(96, 165, 250, 0.5);
    }

    .remove-detail-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border: none;
        border-radius: 0.3rem;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin-bottom: 0.3rem;
    }

    .meta-section {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        border-top: 1px solid rgba(255, 255, 255, 0.03);
        padding-top: 1rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        flex: 1;
    }

    .input-group.mini {
        flex: 0 0 80px;
    }

    .input-group.grow {
        flex: 2;
    }

    label {
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    input[type="text"],
    input[type="number"],
    select {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 0.6rem;
        color: #f8fafc;
        font-size: 0.9rem;
        width: 100%;
        box-sizing: border-box;
    }

    input:focus,
    select:focus {
        border-color: #60a5fa;
        outline: none;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    h3 {
        margin: 0;
        font-size: 1rem;
        color: #f8fafc;
    }

    .add-row-btn {
        background: rgba(96, 165, 250, 0.1);
        color: #60a5fa;
        border: 1px solid rgba(96, 165, 250, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .add-row-btn:hover {
        background: rgba(96, 165, 250, 0.2);
    }

    .delete-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 0.4rem;
        width: 36px;
        height: 36px;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .delete-btn:hover {
        background: rgba(239, 68, 68, 0.2);
    }

    .mobile-top {
        display: none;
    }

    @media (max-width: 640px) {
        .set-row.main {
            flex-wrap: wrap;
        }
        .detail-item {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
        }
        .meta-section {
            flex-wrap: wrap;
        }
        .input-group.mini {
            flex: 1;
        }
        .input-group.grow {
            min-width: 100%;
        }
        .desktop-only {
            display: none;
        }
        .mobile-top {
            display: flex;
        }
    }
</style>
