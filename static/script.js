const toggleButtons = document.querySelectorAll('.toggle-btn');
const fileMode = document.getElementById('file-mode');
const urlMode = document.getElementById('url-mode');
const fileInput = document.getElementById('file-input');
const urlInput = document.getElementById('url-input');
const bucketSlider = document.getElementById('bucket-slider');
const bucketValue = document.getElementById('bucket-value');
const topNSelect = document.getElementById('top-n-select');
const form = document.getElementById('analyze-form');
const analyzeBtn = document.getElementById('analyze-btn');
const preview = document.getElementById('image-preview');
const paletteContainer = document.getElementById('palette');
const errorMessage = document.getElementById('error-message');

let currentMode = 'file';

function clearPalette() {
    paletteContainer.innerHTML = '';
}

function hasSource() {
    return currentMode === 'file'
        ? Boolean(fileInput.files[0])
        : Boolean(urlInput.value);
}

// --- Toggle: file or URL ---
toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode;

        toggleButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        fileMode.classList.toggle('hidden', currentMode !== 'file');
        urlMode.classList.toggle('hidden', currentMode !== 'url');

        clearPalette();
        preview.classList.add('hidden');
    });
});

// --- Slider: update the number next to it ---
bucketSlider.addEventListener('input', () => {
    bucketValue.textContent = bucketSlider.value;
});

bucketSlider.addEventListener('change', () => {
    if (hasSource()) runAnalysis();
});

// --- Number of colors: automatically re-analyze
topNSelect.addEventListener('change', () => {
    if (hasSource()) runAnalysis();
});

// --- New file: preview + clear the old palette ---
fileInput.addEventListener('change', () => {
    clearPalette();
    const file = fileInput.files[0];
    if (!file) {
        preview.classList.add('hidden');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        preview.src = event.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

// --- New URL: cleat the old palette ---
urlInput.addEventListener('input', () => {
    clearPalette();
    preview.classList.add('hidden');
});

// --- Form submission ---
form.addEventListener('submit', (event) => {
    event.preventDefault();
    runAnalysis();
});

// --- Submission logic ---
async function runAnalysis() {
    errorMessage.classList.add('hidden');
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analizing...';

    const formData = new FormData();
    formData.append('bucket_size', bucketSlider.value);
    formData.append('top_n', topNSelect.value);

    if (currentMode == 'file') {
        if (!fileInput.files[0]) {
            showError('Please select a file to analyze.');
            resetButton();
            return;
        }
        formData.append('file', fileInput.files[0]);
    } else {
        if (!urlInput.value) {
            showError('Please enter the image URL.');
            resetButton();
            return;
        }
        formData.append('image_url', urlInput.value);
    }

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'An unexpected error occurred.');
            resetButton();
            return;
        }

        preview.src = data.image_data;
        preview.classList.remove('hidden');
        renderPalette(data.colors);
    } catch (err) {
        console.error(err);
        showError('Failed to connect to the server.');
    }

    resetButton();
}

function resetButton() {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function renderPalette(colors) {
    clearPalette();

    colors.forEach((color) => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.backgroundColor = `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]}`;
        swatch.style.setProperty('--percentage', color.percentage);
        swatch.dataset.hex = color.hex;

        const hexSpan = document.createElement('span');
        hexSpan.className = 'hex-code';
        hexSpan.textContent = color.hex;

        const percentSpan = document.createElement('span');
        percentSpan.className = 'percentage';
        percentSpan.textContent = `${color.percentage}%`;

        swatch.appendChild(hexSpan);
        swatch.appendChild(percentSpan);
        paletteContainer.appendChild(swatch);
    });
}

// --- Copy HEX on click ---
paletteContainer.addEventListener('click', async (event) => {
    const swatch = event.target.closest('.swatch');
    if (!swatch) return;

    try {
        await navigator.clipboard.writeText(swatch.dataset.hex);
    } catch (err) {
        console.error('Failed to copy:', err);
        return;
    }

    swatch.classList.add('copied');
    setTimeout(() => swatch.classList.remove('copied'), 1200);
});
