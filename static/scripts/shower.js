//Code modeled after stopwatch from https://codepen.io/_Billy_Brown/pen/dbJeh with significant changes
class Stopwatch {
    constructor(display, results) {
        this.dateObj = new Date();
        this.running = false;
        this.display = display;
        this.results = results;
        this.laps = [];
        this.reset();
        this.print(this.times);
        this.accumulator1 = 0;
        this.accumulator2 = 0;
    }
    
    reset() {
        this.times = [ 0, 0, 0 ];
        this.time = 0;
        this.accumulator1 = 0;
        this.accumulator2 = 0;
    }
    
    start() {
        if (!this.time || this.time === 0) this.time = performance.now();
        if (!this.running) {
            this.accumulator2 = this.accumulator1;
            this.accumulator1 = this.time;
            this.running = true;
            requestAnimationFrame(this.step.bind(this));
        }
    }
            
    stop() {
        this.running = false;
        this.accumulator1 = this.time - this.accumulator1 + this.accumulator2;
        console.log(new Date(Date.UTC(this.dateObj.getFullYear(), this.dateObj.getMonth(), this.dateObj.getDay(), 0, 0, 0, this.accumulator1)));
        this.time = 0;
    }
    
    clear() {
        this.running = false;
        this.reset();
        this.print(this.times);
    }
    
    step(timestamp) {
        if (!this.running) return;
        this.calculate(timestamp);
        this.time = timestamp;
        this.print();
        requestAnimationFrame(this.step.bind(this));
    }
    
    calculate(timestamp) {
        var diff = timestamp - this.time;
        // Hundredths of a second are 100 ms
        this.times[2] += diff / 10;
        // Seconds are 100 hundredths of a second
        if (this.times[2] >= 100) {
            this.times[1] += 1;
            this.times[2] -= 100;
        }
        // Minutes are 60 seconds
        if (this.times[1] >= 60) {
            this.times[0] += 1;
            this.times[1] -= 60;
        }
    }
    
    print() {
        this.display.innerText = this.format(this.times);
    }
    
    format(times) {
        return `\
        ${pad0(times[0], 2)}:\
        ${pad0(times[1], 2)}:\
        ${pad0(Math.floor(times[2]), 2)}`;
    }
}

function pad0(value, count) {
    var result = value.toString();
    for (; result.length < count; --count)
        result = '0' + result;
    return result;
}

function fillHidden() {
    document.getElementById("watchvalsubmit").value = stopwatch.accumulator1;
}

let stopwatch = new Stopwatch(
    document.querySelector('.stopwatch'));