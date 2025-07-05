class Assembler {
    constructor() {
        this.opcodes = {
            'LOAD_A': '0010',
            'LOAD_B': '0001', 
            'LOAD_C': '0011',
            'LOAD_D': '0000',
            'STORE_A': '0100',
            'STORE_B': '0101',
            'STORE_C': '0110',
            'STORE_D': '0111',
            'ADD': '1000',
            'SUB': '1001',
            'JUMP': '1010',
            'JUMP_NEG': '1011',
            'JUMP_ZRO': '1100',
            'JUMP_ABV': '1101',
            'JUMP_BLW': '1110',
            'HALT': '1111'
        };
        
        this.registers = {
            'A': '00',
            'B': '01', 
            'C': '10',
            'D': '11'
        };
    }
    
    assemble(sourceCode) {
        const lines = this.preprocessCode(sourceCode);
        const program = [];
        const errors = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#') || line.startsWith('//')) {
                continue;
            }
            
            try {
                const instruction = this.assembleLine(line, i + 1);
                if (instruction !== null) {
                    program.push(instruction);
                }
            } catch (error) {
                errors.push(`Line ${i + 1}: ${error.message}`);
            }
        }
        
        if (errors.length > 0) {
            throw new Error('Assembly errors:\n' + errors.join('\n'));
        }
        
        return program;
    }
    
    preprocessCode(code) {
        return code
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
    
    assembleLine(line, lineNumber) {
        const parts = line.split(/\s+/);
        const mnemonic = parts[0].toUpperCase();
        
        if (!this.opcodes.hasOwnProperty(mnemonic)) {
            throw new Error(`Unknown instruction: ${mnemonic}`);
        }
        
        const opcode = this.opcodes[mnemonic];
        
        if (mnemonic === 'HALT') {
            return parseInt(opcode + '0000', 2);
        }
        
        if (parts.length < 2) {
            throw new Error(`Missing operand for ${mnemonic}`);
        }
        
        const operand = parts[1];
        
        if (mnemonic === 'ADD' || mnemonic === 'SUB') {
            return this.assembleArithmetic(opcode, operand);
        } else {
            return this.assembleMemoryOperation(opcode, operand);
        }
    }
    
    assembleArithmetic(opcode, operand) {
        const regs = operand.split(',');
        if (regs.length !== 2) {
            throw new Error('Arithmetic operations require two registers (e.g., A,B)');
        }
        
        const reg1 = regs[0].trim().toUpperCase();
        const reg2 = regs[1].trim().toUpperCase();
        
        if (!this.registers.hasOwnProperty(reg1) || !this.registers.hasOwnProperty(reg2)) {
            throw new Error('Invalid register name. Use A, B, C, or D');
        }
        
        const reg1Code = this.registers[reg1];
        const reg2Code = this.registers[reg2];
        
        return parseInt(opcode + reg1Code + reg2Code, 2);
    }
    
    assembleMemoryOperation(opcode, operand) {
        const address = this.parseAddress(operand);
        if (address < 0 || address > 15) {
            throw new Error('Address must be between 0 and 15');
        }
        
        const addressBinary = address.toString(2).padStart(4, '0');
        return parseInt(opcode + addressBinary, 2);
    }
    
    parseAddress(operand) {
        operand = operand.trim().toUpperCase();
        
        if (operand.endsWith('B')) {
            // Binary
            const binary = operand.slice(0, -1);
            if (!/^[01]+$/.test(binary)) {
                throw new Error('Invalid binary number');
            }
            return parseInt(binary, 2);
        } else if (operand.endsWith('H')) {
            // Hexadecimal
            const hex = operand.slice(0, -1);
            if (!/^[0-9A-F]+$/.test(hex)) {
                throw new Error('Invalid hexadecimal number');
            }
            return parseInt(hex, 16);
        } else if (operand.endsWith('D')) {
            // Decimal
            const decimal = operand.slice(0, -1);
            if (!/^[0-9]+$/.test(decimal)) {
                throw new Error('Invalid decimal number');
            }
            return parseInt(decimal, 10);
        } else {
            // Assume decimal if no suffix
            if (!/^[0-9]+$/.test(operand)) {
                throw new Error('Invalid number format. Use suffix B (binary), D (decimal), or H (hex)');
            }
            return parseInt(operand, 10);
        }
    }
    
    disassemble(program) {
        const lines = [];
        
        for (let i = 0; i < program.length; i++) {
            const instruction = program[i];
            const binary = instruction.toString(2).padStart(8, '0');
            const opcode = binary.substring(0, 4);
            const operand = binary.substring(4, 8);
            
            const mnemonic = Object.keys(this.opcodes).find(key => this.opcodes[key] === opcode);
            
            if (!mnemonic) {
                lines.push(`; Unknown instruction: ${binary}`);
                continue;
            }
            
            if (mnemonic === 'HALT') {
                lines.push('HALT');
            } else if (mnemonic === 'ADD' || mnemonic === 'SUB') {
                const reg1 = Object.keys(this.registers).find(key => this.registers[key] === operand.substring(0, 2));
                const reg2 = Object.keys(this.registers).find(key => this.registers[key] === operand.substring(2, 4));
                lines.push(`${mnemonic} ${reg1},${reg2}`);
            } else {
                const address = parseInt(operand, 2);
                lines.push(`${mnemonic} ${address}D`);
            }
        }
        
        return lines.join('\n');
    }
    
    // Demo programs
    getDemoProgram(demoNumber) {
        switch (demoNumber) {
            case 1: // Add two numbers
                return `LOAD_A 13D
LOAD_B 14D
ADD A,B
STORE_A 15D
HALT`;
            
            case 2: // Subtract two numbers
                return `LOAD_A 13D
LOAD_B 14D
SUB A,B
STORE_A 15D
HALT`;
            
            case 3: // Infinite loop
                return `LOAD_A 14D
LOAD_B 15D
SUB C,D
JUMP_ZRO 8D
ADD A,B
JUMP 4D
STORE_A 12D
HALT`;
            
            default:
                return '';
        }
    }
    
    getDemoData(demoNumber) {
        switch (demoNumber) {
            case 1: // Add two numbers - data at addresses 13 and 14
                return { 13: 25, 14: 8 }; // 25 + 8 = 33
            
            case 2: // Subtract two numbers
                return { 13: 90, 14: 59 }; // 90 - 59 = 31
            
            case 3: // Infinite loop
                return { 14: 10, 15: 11 };
            
            default:
                return {};
        }
    }
}