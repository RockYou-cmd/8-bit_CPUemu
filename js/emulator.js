class Emulator {
    constructor() {
        this.cpu = new CPU();
        this.memory = new Memory(16);
        this.assembler = new Assembler();
        this.ui = new UI();
        
        this.isRunning = false;
        this.runInterval = null;
        
        this.setupComponents();
    }
    
    setupComponents() {
        // Connect components
        this.cpu.setMemory(this.memory);
        this.cpu.setUI(this.ui);
        this.memory.setUI(this.ui);
        
        // Make globally accessible for UI
        window.cpu = this.cpu;
        window.memory = this.memory;
        window.emulator = this;
    }
    
    async loadProgram(sourceCode, demoData = null) {
        try {
            // Assemble the source code
            const program = this.assembler.assemble(sourceCode);
            
            // Reset system
            this.reset();
            
            // Load program into memory
            this.memory.load(program);
            
            // Load demo data if provided
            if (demoData) {
                Object.entries(demoData).forEach(([address, value]) => {
                    this.memory.write(parseInt(address), value);
                });
            }
            
            this.ui.updateAll();
            this.ui.showSuccess('Program loaded successfully');
            
            // Enable run buttons
            this.enableControls();
            
        } catch (error) {
            this.ui.showError(error.message);
            throw error;
        }
    }
    
    async loadBinaryProgram(binaryData) {
        try {
            // Reset system
            this.reset();
            
            // Load binary data directly
            this.memory.load(binaryData);
            
            this.ui.updateAll();
            this.ui.showSuccess('Binary program loaded successfully');
            
            // Enable run buttons
            this.enableControls();
            
        } catch (error) {
            this.ui.showError(error.message);
            throw error;
        }
    }
    
    async step() {
        if (this.cpu.isHalted) {
            this.ui.showError('CPU is halted. Reset to continue.');
            return;
        }
        
        try {
            const canContinue = await this.cpu.step();
            if (!canContinue) {
                this.ui.showSuccess('Program execution completed');
                this.disableRunControls();
            }
        } catch (error) {
            this.ui.showError('Execution error: ' + error.message);
            this.stop();
        }
    }
    
    async run() {
        if (this.isRunning) {
            this.stop();
            return;
        }
        
        if (this.cpu.isHalted) {
            this.ui.showError('CPU is halted. Reset to continue.');
            return;
        }
        
        this.isRunning = true;
        this.updateRunButton();
        
        try {
            await this.cpu.run();
            this.ui.showSuccess('Program execution completed');
        } catch (error) {
            this.ui.showError('Execution error: ' + error.message);
        } finally {
            this.isRunning = false;
            this.updateRunButton();
            this.disableRunControls();
        }
    }
    
    stop() {
        this.isRunning = false;
        this.cpu.stop();
        this.updateRunButton();
    }
    
    reset() {
        this.stop();
        this.cpu.reset();
        this.memory.reset();
        this.ui.updateAll();
        this.ui.clearHighlights();
        this.disableControls();
    }
    
    setSpeed(speed) {
        this.cpu.setSpeed(speed);
    }
    
    enableControls() {
        document.getElementById('stepRun').disabled = false;
        document.getElementById('loopRun').disabled = false;
    }
    
    disableControls() {
        document.getElementById('stepRun').disabled = true;
        document.getElementById('loopRun').disabled = true;
    }
    
    disableRunControls() {
        if (!this.cpu.isHalted) return;
        
        document.getElementById('stepRun').disabled = true;
        document.getElementById('loopRun').disabled = true;
    }
    
    updateRunButton() {
        const button = document.getElementById('loopRun');
        const icon = button.querySelector('.icon');
        
        if (this.isRunning) {
            icon.textContent = '⏸️';
            button.title = 'Pause';
        } else {
            icon.textContent = '▶️';
            button.title = 'Run';
        }
    }
    
    loadDemo(demoNumber) {
        const sourceCode = this.assembler.getDemoProgram(demoNumber);
        const demoData = this.assembler.getDemoData(demoNumber);
        
        return this.loadProgram(sourceCode, demoData);
    }
    
    exportProgram() {
        const program = this.memory.getData();
        const sourceCode = this.assembler.disassemble(program);
        return sourceCode;
    }
    
    getSystemState() {
        return {
            registers: { ...this.cpu.registers },
            instructionRegister: this.cpu.instructionRegister,
            addressRegister: this.cpu.addressRegister,
            programCounter: this.cpu.programCounter,
            flags: { ...this.cpu.flags },
            memory: this.memory.getData(),
            stage: this.cpu.stage,
            cycleCount: this.cpu.cycleCount,
            isHalted: this.cpu.isHalted
        };
    }
}