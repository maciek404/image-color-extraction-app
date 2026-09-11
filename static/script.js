const fileInput = document.getElementById('file-input');
const preview = document.getElementById('image-preview');

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        preview.src = event.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

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