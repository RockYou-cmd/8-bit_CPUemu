class UI {
    constructor() {
        this.numberBases = {
            registers: 'BIN',
            memory: 'BIN',
            instruction: 'BIN',
            address: 'BIN'
        };
        
        this.memoryBases = new Array(16).fill('BIN');
        this.highlightedElements = new Set();
    }
    
    init() {
        this.setupEventListeners();
        this.generateMemoryGrid();
        this.updateAll();
    }
    
    setupEventListeners() {
        // Base toggle buttons for registers
        document.querySelectorAll('.base-toggle[data-register]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const register = e.target.dataset.register;
                this.toggleRegisterBase(register);
            });
        });
        
        // RAM address base toggle
        document.getElementById('ramAddressToggle').addEventListener('click', () => {
            this.toggleMemoryAddressBase();
        });
        
        // Memory cell base toggles will be added dynamically
    }
    
    generateMemoryGrid() {
        const grid = document.getElementById('memoryGrid');
        grid.innerHTML = '';
        
        // Headers
        const addressHeader = document.createElement('div');
        addressHeader.className = 'memory-header';
        addressHeader.textContent = 'Address';
        grid.appendChild(addressHeader);
        
        const dataHeader = document.createElement('div');
        dataHeader.className = 'memory-header';
        dataHeader.textContent = 'Data';
        grid.appendChild(dataHeader);
        
        // Memory cells
        for (let i = 0; i < 16; i++) {
            // Address cell
            const addressCell = document.createElement('div');
            addressCell.className = 'memory-address';
            addressCell.id = `addr-${i}`;
            grid.appendChild(addressCell);
            
            // Data cell
            const dataCell = document.createElement('div');
            dataCell.className = 'memory-cell';
            dataCell.innerHTML = `
                <div class="memory-value" id="mem-${i}">00000000</div>
                <button class="memory-toggle" data-address="${i}">(BIN)</button>
            `;
            grid.appendChild(dataCell);
            
            // Add event listener for memory cell base toggle
            const toggleBtn = dataCell.querySelector('.memory-toggle');
            toggleBtn.addEventListener('click', () => {
                this.toggleMemoryBase(i);
            });
        }
        
        this.updateMemory();
    }
    
    toggleRegisterBase(register) {
        const currentBase = this.numberBases.registers;
        let newBase;
        
        if (register === 'IR') {
            // Instruction register cycles through BIN -> OPC_BIN -> OPC_DEC -> BIN
            const currentInstBase = this.numberBases.instruction;
            if (currentInstBase === 'BIN') {
                newBase = 'OPC_BIN';
            } else if (currentInstBase === 'OPC_BIN') {
                newBase = 'OPC_DEC';
            } else {
                newBase = 'BIN';
            }
            this.numberBases.instruction = newBase;
        } else if (register === 'AR') {
            // Address register toggles between BIN and DEC
            this.numberBases.address = currentBase === 'BIN' ? 'DEC' : 'BIN';
            newBase = this.numberBases.address;
        } else {
            // Regular registers toggle between BIN and DEC
            this.numberBases.registers = currentBase === 'BIN' ? 'DEC' : 'BIN';
            newBase = this.numberBases.registers;
        }
        
        this.updateRegisterDisplays();
        this.updateToggleButtons();
    }
    
    toggleMemoryAddressBase() {
        this.numberBases.memory = this.numberBases.memory === 'BIN' ? 'DEC' : 'BIN';
        this.updateMemory();
        this.updateToggleButtons();
    }
    
    toggleMemoryBase(address) {
        const currentBase = this.memoryBases[address];
        let newBase;
        
        switch (currentBase) {
            case 'BIN':
                newBase = 'OPC_BIN';
                break;
            case 'OPC_BIN':
                newBase = 'OPC_DEC';
                break;
            case 'OPC_DEC':
                newBase = 'DEC';
                break;
            case 'DEC':
                newBase = 'BIN';
                break;
            default:
                newBase = 'BIN';
        }
        
        this.memoryBases[address] = newBase;
        this.updateMemoryCell(address);
        
        // Update toggle button
        const toggleBtn = document.querySelector(`[data-address="${address}"]`);
        if (toggleBtn) {
            toggleBtn.textContent = `(${newBase.replace('_', '')})`;
        }
    }
    
    updateToggleButtons() {
        // Update register toggle buttons
        document.querySelectorAll('.base-toggle[data-register]').forEach(btn => {
            const register = btn.dataset.register;
            let base;
            
            if (register === 'IR') {
                base = this.numberBases.instruction;
            } else if (register === 'AR') {
                base = this.numberBases.address;
            } else {
                base = this.numberBases.registers;
            }
            
            btn.textContent = `(${base.replace('_', '')})`;
        });
        
        // Update RAM address toggle button
        const ramToggle = document.getElementById('ramAddressToggle');
        if (ramToggle) {
            ramToggle.textContent = `(${this.numberBases.memory})`;
        }
    }
    
    updateRegisterDisplays() {
        if (!window.cpu) return;
        
        // Update regular registers
        ['A', 'B', 'C', 'D'].forEach(reg => {
            const value = window.cpu.getRegisterValue(reg);
            const element = document.querySelector(`[data-register="${reg}"]`);
            if (element) {
                element.textContent = this.formatValue(value, this.numberBases.registers);
            }
        });
        
        // Update instruction register
        const irElement = document.querySelector('[data-register="IR"]');
        if (irElement) {
            const value = window.cpu.getRegisterValue('IR');
            if (this.numberBases.instruction.startsWith('OPC')) {
                const instruction = window.cpu.getCurrentInstruction();
                if (instruction) {
                    irElement.textContent = this.formatInstruction(instruction, this.numberBases.instruction);
                } else {
                    irElement.textContent = this.formatValue(value, 'BIN');
                }
            } else {
                irElement.textContent = this.formatValue(value, this.numberBases.instruction);
            }
        }
        
        // Update address register
        const arElement = document.querySelector('[data-register="AR"]');
        if (arElement) {
            const value = window.cpu.getRegisterValue('AR');
            arElement.textContent = this.formatValue(value, this.numberBases.address, 4);
        }
    }
    
    updateMemory() {
        if (!window.memory) return;
        
        for (let i = 0; i < 16; i++) {
            // Update address display
            const addrElement = document.getElementById(`addr-${i}`);
            if (addrElement) {
                addrElement.textContent = this.formatValue(i, this.numberBases.memory, 4);
            }
            
            // Update memory cell
            this.updateMemoryCell(i);
        }
    }
    
    updateMemoryCell(address) {
        if (!window.memory) return;
        
        const value = window.memory.read(address);
        const element = document.getElementById(`mem-${address}`);
        if (element) {
            const base = this.memoryBases[address];
            if (base.startsWith('OPC')) {
                // Try to format as instruction
                const instruction = window.cpu ? window.cpu.parseInstruction(value) : null;
                if (instruction) {
                    element.textContent = this.formatInstruction(instruction, base);
                } else {
                    element.textContent = this.formatValue(value, 'BIN');
                }
            } else {
                element.textContent = this.formatValue(value, base);
            }
        }
    }
    
    formatValue(value, base, minDigits = 8) {
        switch (base) {
            case 'BIN':
                return value.toString(2).padStart(minDigits, '0');
            case 'DEC':
                return value.toString(10);
            case 'HEX':
                return value.toString(16).toUpperCase().padStart(Math.ceil(minDigits/4), '0');
            default:
                return value.toString(2).padStart(minDigits, '0');
        }
    }
    
    formatInstruction(instruction, base) {
        if (!instruction) return '00000000';
        
        const { mnemonic, operand } = instruction;
        
        if (base === 'OPC_BIN') {
            if (mnemonic === 'ADD' || mnemonic === 'SUB') {
                const reg1 = operand.substring(0, 2);
                const reg2 = operand.substring(2, 4);
                return `${mnemonic} ${reg1} ${reg2}`;
            } else if (mnemonic === 'HALT') {
                return 'HALT';
            } else {
                return `${mnemonic} ${operand}`;
            }
        } else if (base === 'OPC_DEC') {
            if (mnemonic === 'ADD' || mnemonic === 'SUB') {
                const reg1Index = parseInt(operand.substring(0, 2), 2);
                const reg2Index = parseInt(operand.substring(2, 4), 2);
                const regNames = ['A', 'B', 'C', 'D'];
                return `${mnemonic} ${regNames[reg1Index]} ${regNames[reg2Index]}`;
            } else if (mnemonic === 'HALT') {
                return 'HALT';
            } else {
                const address = parseInt(operand, 2);
                return `${mnemonic} ${address}`;
            }
        }
        
        return this.formatValue(instruction.value, 'BIN');
    }
    
    updateALU(input1, input2, operation, result = null) {
        document.getElementById('aluInputA').textContent = input1 || 0;
        document.getElementById('aluInputB').textContent = input2 || 0;
        document.getElementById('aluOperation').textContent = operation || '-';
        document.getElementById('aluOutput').textContent = result !== null ? result : '-';
    }
    
    updateFlags(flags) {
        document.getElementById('oFlag').classList.toggle('active', flags.overflow);
        document.getElementById('zFlag').classList.toggle('active', flags.zero);
        document.getElementById('nFlag').classList.toggle('active', flags.negative);
    }
    
    updateStatus() {
        if (!window.cpu) return;
        
        document.getElementById('cpuStage').textContent = window.cpu.stage;
        document.getElementById('programCounter').textContent = window.cpu.programCounter;
        document.getElementById('cycleCount').textContent = window.cpu.cycleCount;
    }
    
    highlightRegister(register) {
        this.clearHighlights();
        
        let element;
        if (register === 'IR') {
            element = document.getElementById('instructionReg');
        } else if (register === 'AR') {
            element = document.getElementById('addressReg');
        } else {
            element = document.getElementById(`reg${register}`);
        }
        
        if (element) {
            element.classList.add('highlight');
            this.highlightedElements.add(element);
        }
    }
    
    highlightMemory(address) {
        const element = document.getElementById(`mem-${address}`);
        if (element) {
            element.parentElement.classList.add('highlight');
            this.highlightedElements.add(element.parentElement);
        }
    }
    
    clearHighlights() {
        this.highlightedElements.forEach(element => {
            element.classList.remove('highlight');
        });
        this.highlightedElements.clear();
    }
    
    updateAll() {
        this.updateRegisterDisplays();
        this.updateMemory();
        this.updateStatus();
        this.updateToggleButtons();
        
        if (window.cpu) {
            this.updateFlags(window.cpu.flags);
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    showError(message) {
        alert('Error: ' + message);
    }
    
    showSuccess(message) {
        // You could implement a toast notification here
        console.log('Success:', message);
    }
}