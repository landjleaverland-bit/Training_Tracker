<script>
    import { fade } from "svelte/transition";

    let location = "";
    let session = "";
    let exercises = [];

    export function getData() {
        return {
            location,
            session,
            exercises,
            fingerLoad: 0,
            shoulderLoad: 0,
            forearmLoad: 0,
        };
    }
</script>

<div class="activity-config" in:fade>
    <h3>Outdoor Climb Config</h3>
    <p>
        Specific fields for outdoor climbing will go here (e.g., Crag, Route
        Name, Grade, Style).
    </p>
    <div class="placeholder-box">
        <!-- Future fields will be added here -->
    </div>
</div>

<style>
    .activity-config {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 0.75rem;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 1rem;
    }
    h3 {
        margin-top: 0;
        color: #60a5fa;
        font-size: 1.125rem;
    }
    p {
        font-size: 0.875rem;
        color: #94a3b8;
    }
    .placeholder-box {
        height: 100px;
        border: 2px dashed rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        margin-top: 1rem;
    }
</style>
