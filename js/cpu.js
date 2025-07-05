class CPU {
    constructor() {
        this.registers = {
            A: 0,
            B: 0,
            C: 0,
            D: 0
        };
        
        this.instructionRegister = 0;
        this.addressRegister = 0;
        this.programCounter = 0;
        
        this.flags = {
            overflow: false,
            zero: false,
            negative: false
        };
        
        this.stage = 'IDLE';
        this.isRunning = false;
        this.isHalted = false;
        this.cycleCount = 0;
        
        this.memory = null;
        this.ui = null;
        
        this.speed = 1.0;
        this.baseDelay = 1000; // 1 second base delay
    }
    
    setMemory(memory) {
        this.memory = memory;
    }
    
    setUI(ui) {
        this.ui = ui;
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    reset() {
        this.registers = { A: 0, B: 0, C: 0, D: 0 };
        this.instructionRegister = 0;
        this.addressRegister = 0;
        this.programCounter = 0;
        this.flags = { overflow: false, zero: false, negative: false };
        this.stage = 'IDLE';
        this.isRunning = false;
        this.isHalted = false;
        this.cycleCount = 0;
        
        if (this.ui) {
            this.ui.updateAll();
        }
    }
    
    async step() {
        if (this.isHalted) return false;
        
        this.cycleCount++;
        
        switch (this.stage) {
            case 'IDLE':
            case 'FETCH':
                await this.fetch();
                this.stage = 'DECODE';
                break;
            case 'DECODE':
                await this.decode();
                this.stage = 'EXECUTE';
                break;
            case 'EXECUTE':
                await this.execute();
                this.stage = 'FETCH';
                break;
        }
        
        if (this.ui) {
            this.ui.updateAll();
        }
        
        return !this.isHalted;
    }
    
    async fetch() {
        this.stage = 'FETCH';
        
        // Highlight address register
        if (this.ui) {
            this.ui.highlightRegister('AR');
            await this.delay(500);
        }
        
        // Set address register to program counter
        this.addressRegister = this.programCounter;
        
        // Read instruction from memory
        const instruction = this.memory.read(this.programCounter);
        this.instructionRegister = instruction;
        
        // Highlight instruction register
        if (this.ui) {
            this.ui.highlightMemory(this.programCounter);
            this.ui.highlightRegister('IR');
            await this.delay(500);
        }
    }
    
    async decode() {
        this.stage = 'DECODE';
        
        if (this.ui) {
            // Flash instruction register to show decoding
            for (let i = 0; i < 3; i++) {
                this.ui.highlightRegister('IR');
                await this.delay(200);
                this.ui.clearHighlights();
                await this.delay(200);
            }
        }
    }
    
    async execute() {
        this.stage = 'EXECUTE';
        
        const instruction = this.parseInstruction(this.instructionRegister);
        
        if (!instruction) {
            console.error('Invalid instruction:', this.instructionRegister.toString(2).padStart(8, '0'));
            this.isHalted = true;
            return;
        }
        
        await this.executeInstruction(instruction);
        
        // Clear all highlights
        if (this.ui) {
            this.ui.clearHighlights();
        }
    }
    
    parseInstruction(value) {
        const binary = value.toString(2).padStart(8, '0');
        const opcode = binary.substring(0, 4);
        const operand = binary.substring(4, 8);
        
        const instructions = {
            '0000': 'LOAD_D',
            '0001': 'LOAD_B', 
            '0010': 'LOAD_A',
            '0011': 'LOAD_C',
            '0100': 'STORE_A',
            '0101': 'STORE_B',
            '0110': 'STORE_C',
            '0111': 'STORE_D',
            '1000': 'ADD',
            '1001': 'SUB',
            '1010': 'JUMP',
            '1011': 'JUMP_NEG',
            '1100': 'JUMP_ZRO',
            '1101': 'JUMP_ABV',
            '1110': 'JUMP_BLW',
            '1111': 'HALT'
        };
        
        const mnemonic = instructions[opcode];
        if (!mnemonic) return null;
        
        return {
            mnemonic,
            opcode,
            operand,
            value
        };
    }
    
    async executeInstruction(instruction) {
        const { mnemonic, operand } = instruction;
        
        switch (mnemonic) {
            case 'LOAD_A':
                await this.loadRegister('A', parseInt(operand, 2));
                break;
            case 'LOAD_B':
                await this.loadRegister('B', parseInt(operand, 2));
                break;
            case 'LOAD_C':
                await this.loadRegister('C', parseInt(operand, 2));
                break;
            case 'LOAD_D':
                await this.loadRegister('D', parseInt(operand, 2));
                break;
            case 'STORE_A':
                await this.storeRegister('A', parseInt(operand, 2));
                break;
            case 'STORE_B':
                await this.storeRegister('B', parseInt(operand, 2));
                break;
            case 'STORE_C':
                await this.storeRegister('C', parseInt(operand, 2));
                break;
            case 'STORE_D':
                await this.storeRegister('D', parseInt(operand, 2));
                break;
            case 'ADD':
                await this.arithmeticOperation('ADD', operand);
                break;
            case 'SUB':
                await this.arithmeticOperation('SUB', operand);
                break;
            case 'JUMP':
                this.jump(parseInt(operand, 2));
                break;
            case 'JUMP_NEG':
                if (this.flags.negative) {
                    this.jump(parseInt(operand, 2));
                } else {
                    this.programCounter++;
                }
                break;
            case 'JUMP_ZRO':
                if (this.flags.zero) {
                    this.jump(parseInt(operand, 2));
                } else {
                    this.programCounter++;
                }
                break;
            case 'HALT':
                this.isHalted = true;
                this.stage = 'HALT';
                break;
            default:
                this.programCounter++;
        }
        
        if (mnemonic !== 'JUMP' && mnemonic !== 'JUMP_NEG' && mnemonic !== 'JUMP_ZRO' && mnemonic !== 'HALT') {
            this.programCounter++;
        }
    }
    
    async loadRegister(register, address) {
        // Highlight memory address
        if (this.ui) {
            this.ui.highlightMemory(address);
            await this.delay(300);
        }
        
        const value = this.memory.read(address);
        this.registers[register] = value;
        
        // Highlight target register
        if (this.ui) {
            this.ui.highlightRegister(register);
            await this.delay(300);
        }
    }
    
    async storeRegister(register, address) {
        // Highlight source register
        if (this.ui) {
            this.ui.highlightRegister(register);
            await this.delay(300);
        }
        
        const value = this.registers[register];
        this.memory.write(address, value);
        
        // Highlight memory address
        if (this.ui) {
            this.ui.highlightMemory(address);
            await this.delay(300);
        }
    }
    
    async arithmeticOperation(operation, operand) {
        const reg1Index = parseInt(operand.substring(0, 2), 2);
        const reg2Index = parseInt(operand.substring(2, 4), 2);
        
        const regNames = ['A', 'B', 'C', 'D'];
        const reg1 = regNames[reg1Index];
        const reg2 = regNames[reg2Index];
        
        // Highlight input registers
        if (this.ui) {
            this.ui.highlightRegister(reg1);
            this.ui.highlightRegister(reg2);
            await this.delay(300);
        }
        
        const val1 = this.registers[reg1];
        const val2 = this.registers[reg2];
        
        // Show ALU operation
        if (this.ui) {
            this.ui.updateALU(val1, val2, operation);
            await this.delay(500);
        }
        
        let result;
        if (operation === 'ADD') {
            result = val1 + val2;
        } else if (operation === 'SUB') {
            result = val1 - val2;
        }
        
        // Handle overflow and flags
        this.flags.overflow = result > 127 || result < -128;
        if (this.flags.overflow) {
            if (result > 127) {
                result = result - 256;
            } else if (result < -128) {
                result = result + 256;
            }
        }
        
        this.flags.zero = result === 0;
        this.flags.negative = result < 0;
        
        // Convert to signed byte
        if (result < 0) {
            result = 256 + result;
        }
        result = result & 0xFF;
        
        this.registers[reg1] = result;
        
        // Show result
        if (this.ui) {
            this.ui.updateALU(val1, val2, operation, result);
            this.ui.highlightRegister(reg1);
            this.ui.updateFlags(this.flags);
            await this.delay(500);
        }
    }
    
    jump(address) {
        this.programCounter = address;
        if (this.ui) {
            this.ui.highlightRegister('AR');
        }
    }
    
    async run() {
        this.isRunning = true;
        
        while (this.isRunning && !this.isHalted) {
            const canContinue = await this.step();
            if (!canContinue) break;
            
            await this.delay(this.baseDelay / this.speed);
        }
        
        this.isRunning = false;
    }
    
    stop() {
        this.isRunning = false;
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms / this.speed));
    }
    
    getRegisterValue(register) {
        if (register === 'IR') return this.instructionRegister;
        if (register === 'AR') return this.addressRegister;
        return this.registers[register] || 0;
    }
    
    getCurrentInstruction() {
        if (this.instructionRegister === 0) return null;
        return this.parseInstruction(this.instructionRegister);
    }
}