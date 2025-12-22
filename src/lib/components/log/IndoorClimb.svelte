<script>
    import { fade } from "svelte/transition";
</script>

<div class="activity-config" in:fade>
    <h3>Indoor Climb Config</h3>
    <p>
        Specific fields for indoor climbing will go here (e.g., Grade, Wall
        Type, attempts).
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
