// Global emulator instance
let emulator;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Create emulator instance
    emulator = new Emulator();
    
    // Initialize UI
    emulator.ui.init();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial update
    emulator.ui.updateAll();
});

function setupEventListeners() {
    // Toolbar buttons
    document.getElementById('newFile').addEventListener('click', showProgramEditor);
    document.getElementById('loadFile').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput').addEventListener('change', handleFileLoad);
    
    document.getElementById('stepRun').addEventListener('click', () => {
        emulator.step();
    });
    
    document.getElementById('loopRun').addEventListener('click', () => {
        emulator.run();
    });
    
    document.getElementById('reset').addEventListener('click', () => {
        emulator.reset();
    });
    
    // Speed control
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        emulator.setSpeed(speed);
        document.getElementById('speedValue').textContent = speed.toFixed(1) + 'x';
    });
    
    // Help and about buttons
    document.getElementById('helpBtn').addEventListener('click', () => {
        emulator.ui.showModal('helpModal');
    });
    
    document.getElementById('aboutBtn').addEventListener('click', () => {
        emulator.ui.showModal('aboutModal');
    });
    
    // Modal controls
    setupModalControls();
    
    // Program editor controls
    setupProgramEditorControls();
}

function setupModalControls() {
    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function setupProgramEditorControls() {
    // Demo buttons
    document.getElementById('loadDemo1').addEventListener('click', () => {
        const sourceCode = emulator.assembler.getDemoProgram(1);
        document.getElementById('programEditor').value = sourceCode;
    });
    
    document.getElementById('loadDemo2').addEventListener('click', () => {
        const sourceCode = emulator.assembler.getDemoProgram(2);
        document.getElementById('programEditor').value = sourceCode;
    });
    
    document.getElementById('loadDemo3').addEventListener('click', () => {
        const sourceCode = emulator.assembler.getDemoProgram(3);
        document.getElementById('programEditor').value = sourceCode;
    });
    
    // Assemble and load button
    document.getElementById('assembleCode').addEventListener('click', () => {
        const sourceCode = document.getElementById('programEditor').value;
        
        try {
            // Try to determine if this is a demo program
            let demoData = null;
            for (let i = 1; i <= 3; i++) {
                const demoCode = emulator.assembler.getDemoProgram(i);
                if (sourceCode.trim() === demoCode.trim()) {
                    demoData = emulator.assembler.getDemoData(i);
                    break;
                }
            }
            
            emulator.loadProgram(sourceCode, demoData);
            emulator.ui.hideModal('programModal');
        } catch (error) {
            emulator.ui.showError('Assembly failed: ' + error.message);
        }
    });
}

function showProgramEditor() {
    // Clear the editor
    document.getElementById('programEditor').value = '';
    emulator.ui.showModal('programModal');
}

function handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        try {
            if (file.name.endsWith('.txt') || file.name.endsWith('.asm')) {
                // Assume it's assembly source code
                emulator.loadProgram(content);
            } else {
                // Try to parse as binary data
                const lines = content.split('\n');
                const binaryData = [];
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && /^[01]{8}$/.test(trimmed)) {
                        binaryData.push(parseInt(trimmed, 2));
                    } else if (trimmed && /^[0-9]+$/.test(trimmed)) {
                        binaryData.push(parseInt(trimmed, 10));
                    }
                }
                
                if (binaryData.length > 0) {
                    emulator.loadBinaryProgram(binaryData);
                } else {
                    throw new Error('Invalid file format');
                }
            }
        } catch (error) {
            emulator.ui.showError('Failed to load file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    
    // Clear the input
    event.target.value = '';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Only handle shortcuts when not typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (e.key) {
        case 'F5':
        case ' ':
            e.preventDefault();
            if (!emulator.cpu.isHalted) {
                emulator.run();
            }
            break;
        case 'F10':
            e.preventDefault();
            if (!emulator.cpu.isHalted) {
                emulator.step();
            }
            break;
        case 'F2':
            e.preventDefault();
            emulator.reset();
            break;
        case 'Escape':
            e.preventDefault();
            emulator.stop();
            break;
    }
});

// Export for debugging
window.emulator = emulator;