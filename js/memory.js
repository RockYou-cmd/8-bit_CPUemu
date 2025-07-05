class Memory {
    constructor(size = 16) {
        this.size = size;
        this.data = new Array(size).fill(0);
        this.ui = null;
    }
    
    setUI(ui) {
        this.ui = ui;
    }
    
    read(address) {
        if (address < 0 || address >= this.size) {
            console.error('Memory read out of bounds:', address);
            return 0;
        }
        return this.data[address];
    }
    
    write(address, value) {
        if (address < 0 || address >= this.size) {
            console.error('Memory write out of bounds:', address);
            return;
        }
        
        // Ensure value is within byte range
        value = value & 0xFF;
        this.data[address] = value;
        
        if (this.ui) {
            this.ui.updateMemory();
        }
    }
    
    load(program) {
        // Reset memory
        this.data.fill(0);
        
        // Load program data
        for (let i = 0; i < program.length && i < this.size; i++) {
            this.data[i] = program[i] & 0xFF;
        }
        
        if (this.ui) {
            this.ui.updateMemory();
        }
    }
    
    reset() {
        this.data.fill(0);
        if (this.ui) {
            this.ui.updateMemory();
        }
    }
    
    getData() {
        return [...this.data];
    }
    
    getSize() {
        return this.size;
    }
}