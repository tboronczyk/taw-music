const svgNS = 'http://www.w3.org/2000/svg';

// min inclusive, max exclusive
function getRandomInt(max = 1, min = 0) {
    return Math.floor(min + Math.random() * (max - min));
}

function createSquare(size) {
    const shape = document.createElementNS(svgNS, 'rect');
    //shape.setAttribute('x', 0);
    //shape.setAttribute('y', 0);
    shape.setAttribute('width', size);
    shape.setAttribute('height', size);
    shape.name = 'square';
    return shape;
}

function createCircle(size) {
    const shape = document.createElementNS(svgNS, 'circle');
    shape.setAttribute('cx', size / 2);
    shape.setAttribute('cy', size / 2);
    shape.setAttribute('r', size / 2);
    shape.name = 'circle';
    return shape;
}

function createTriangle(size) {
    const shape = document.createElementNS(svgNS, 'path');
    shape.setAttribute('d', `M ${size / 2} 0 L 0 ${size} L ${size} ${size} Z`);
    shape.name = 'triangle';
    return shape;
}

function getRandomShape(size) {
    const funcs = [
        createSquare,
        createCircle,
        createTriangle
    ];
    const func = funcs[getRandomInt(funcs.length)];
    return func(size);
}

const colors = ['#008EBD', '#BD008E', '#8EBD00'];

const frequencies = [
    525.25 /*C5 */, 587.33 /*D5 */, 659.25 /*E5*/, 783.99 /*G5 */, 880.00 /*A5*/,
    277.18 /*C#4*/, 311.13 /*D#4*/, 349.23 /*F4*/, 369.99 /*G#4*/, 493.88 /*B4*/,
    261.63 /*C4 */, 293.66 /*D4 */, 329.63 /*E4*/, 392.00 /*G4 */, 440.00 /*A4*/,
    138.59 /*C#3*/, 155.56 /*D#3*/, 174.61 /*F3*/, 207.65 /*G#3*/, 246.94 /*B3*/,
    130.81 /*C3 */, 146.83 /*D3 */, 164.81 /*E3*/, 196.00 /*G3 */, 220.00 /*A3*/,
];

const nCells = Math.sqrt(frequencies.length);
const cellSize = 20;
const spacing = 2;
const margin = 20;

const width = nCells * (cellSize + spacing) + (margin * 2);
const height = width;

const svg = document.createElementNS(svgNS, 'svg');
svg.setAttribute('xmlns', svgNS);
svg.setAttribute('width', window.innerWidth);
svg.setAttribute('height', window.innerHeight);
svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
//svg.style.backgroundColor = '#fff';

window.addEventListener('resize', (evt) => {
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
});

const filter = document.createElementNS(svgNS, 'filter');
filter.setAttribute('id', 'vibrate');
filter.innerHTML = `
  <feTurbulence type="turbulance" baseFrequency="0.05" numOctaves="2" result="turbulence"/>
  <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" in2="turbulence">
   <animate attributeName="scale" values="0;0.5;0;-0.5;0" dur="0.12s" repeatCount="indefinite"/>
  </feDisplacementMap>`; 
svg.appendChild(filter);

// whether triangles point up (0) or down (1)
const invertTriangle = getRandomInt(2);

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audio = new AudioContext();

const attack = 10;
const decay = 500;

function onClick() {
    const gain = audio.createGain();
    gain.connect(audio.destination);
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(1, audio.currentTime + attack / 1000);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + decay / 1000);

    const osc = audio.createOscillator();
    osc.frequency.value = this.dataset.freq;
    osc.type = this.dataset.wavform;
    osc.connect(gain);
    osc.start(0);

    this.setAttribute('filter', 'url(#vibrate)');
    setTimeout(() => {
        osc.stop(0);
        osc.disconnect(gain);
        gain.disconnect(audio.destination);
        this.setAttribute('filter', '');
    }, decay);
}

for (let y = 0; y < nCells; ++y) {
    for (let x = 0; x < nCells; ++x) {
        // position
        const transforms = [
            'translate(' +
            (margin + (spacing/2) + (x * (cellSize + spacing))) + ',' +
            (margin + (spacing/2) + (y * (cellSize + spacing))) + ')'
        ];

        const color = colors[getRandomInt(colors.length)];

        const shape = getRandomShape(cellSize);
        shape.setAttribute('fill', color);

        if (shape.name == 'triangle' && invertTriangle) {
            transforms.push(`translate(0, ${cellSize})`);
            transforms.push('scale(1, -1)');
        }
        shape.setAttribute('transform', transforms);

        switch (shape.name) {
            case 'square':
                shape.dataset.wavform = 'square';
                break;
            case 'triangle':
                shape.dataset.wavform = 'sawtooth';
                break;
            case 'circle':
            default:
                shape.dataset.wavform = 'sine';
                break;
        }

        shape.dataset.freq = frequencies[nCells * y + x] ?? 440.00;

        shape.addEventListener('click', onClick);
        svg.appendChild(shape);
    }
}

document.getElementById('app').appendChild(svg);
