document.querySelectorAll('.swatch').forEach((swatch) => {
    swatch.addEventListener('click', async () => {
        const hex = swatch.dataset.hex;

        try {
            await navigator.clipboard.writeText(hex);
        } catch (err) {
            console.error('Failed to copy:', err);
            return;
        }

        swatch.classList.add('copied');
        setTimeout(() => swatch.classList.remove('copied'), 1200);
    });
});