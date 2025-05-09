const mainBox = document.querySelector('.mainBox');
const workspace = document.querySelector('#svg1');
const btn = document.querySelector('#btn');
const btn1 = document.querySelector('#btn1');
const text = document.querySelector('#codeInput');
const runCodeSimulation = document.querySelector('#btn2');
let activeElement = null;
let offsetX = 0;
let offsetY = 0;
let isDrawing = false;
let currentWire = null; 
const pinsArray = []; 
let loopRunning = true; // Add at the top

// Stop button logic



// ye code arduino ki compiler ki grammer bata hai
const grammar = ohm.grammar(`
  Arduino {
    Program = Setup Loop
    Setup = "void" "setup" "()" Block
    Loop = "void" "loop" "()" Block
    Block = "{" Statement* "}"
    Statement = VarDecl | PinMode | DigitalWrite | Delay
    VarDecl = "int" ident "=" Number ";"
    PinMode = "pinMode" "(" Expr "," Mode ")" ";"
    DigitalWrite = "digitalWrite" "(" Expr "," State ")" ";"
    Delay = "delay" "(" Expr ")" ";"
    Mode = "OUTPUT" | "INPUT"
    State = "HIGH" | "LOW"
    Expr = ident | Number
    ident = letter alnum*
    Number = digit+
  }
`);
const semantics = grammar.createSemantics().addOperation("eval(memory)", {
  Program(setup, loop) {
    const memory = {};
    return {
      setup: setup.eval(memory),
      loop: loop.eval(memory)
    };
  },
  Setup(_1, _2, _3, block) {
    return block.eval(this.args.memory);
  },
  Loop(_1, _2, _3, block) {
    return block.eval(this.args.memory);
  },
  Block(_1, statements, _2) {
    return statements.children.map(s => s.eval(this.args.memory));
  },
  VarDecl(_int, id, _eq, num, _semi) {
    const name = id.sourceString;
    this.args.memory[name] = parseInt(num.sourceString);
    return { type: "declare", name, value: this.args.memory[name] };
  },
  PinMode(_1, _2, pin, _3, mode, _4, _5) {
    const pinVal = pin.eval(this.args.memory);
    return { type: "pinMode", pin: pinVal, mode: mode.sourceString };
  },
  DigitalWrite(_1, _2, pin, _3, state, _4, _5) {
    const pinVal = pin.eval(this.args.memory);
    return { type: "digitalWrite", pin: pinVal, state: state.sourceString };
  },
  Delay(_1, _2, val, _3, _4) {
    const delayVal = val.eval(this.args.memory);
    return { type: "wait", delay: delayVal };
  },
  Mode(_) {
    return this.sourceString;
  },
  State(_) {
    return this.sourceString;
  },
  Expr(expr) {
    if (expr.ctorName === "ident") {
      const name = expr.sourceString;
      if (this.args.memory.hasOwnProperty(name)) {
        return this.args.memory[name];
      } else {
        throw new Error(`Undefined variable: ${name}`);
      }
    }
    return parseInt(expr.sourceString);
  },
  ident(_first, _rest) {
    return this.sourceString;
  },
  Number(_) {
    return parseInt(this.sourceString);
  }
});
async function runCode() {
  const code = document.getElementById("codeInput").value;
  const match = grammar.match(code);

  if (match.succeeded()) {
    const memory = {};
    const result = semantics(match).eval(memory);
    await simulate(result.setup);
    simulateLoop(result.loop);
  } else {
    alert("Syntax error in code!");
  }
}

async function simulate(commands) {
  const ledImg = document.getElementById("led");
  

  for (const cmd of commands) {
    if (cmd.type === "digitalWrite") {
      if (cmd.pin == connections[0].endPin.dataset.pin) {
      
        ledImg.style.filter = cmd.state === "HIGH" ? "brightness(1.4)" : "brightness(0)";
      }
      else{
        
        setTimeout(()=>{
          alert('sahi se connection karo ')
          document.removeEventListener('click',runCode)
        },1000)
      } 
    } else if (cmd.type === "wait") {
      await new Promise(res => setTimeout(res, cmd.delay));
    }
  }
}


async function simulateLoop(commands) {
  loopRunning = true; 
  while (loopRunning) {
    await simulate(commands);
  }
}
   
document.getElementById("stopBtn").addEventListener("click", () => {
  loopRunning = false;
  const ledImg = document.getElementById("led");
  if (ledImg) {
    ledImg.style.filter = "brightness(0)"; // LED off
  }
}); 
btn.addEventListener('click',()=>{
  text.style.display='block'
  text.style.height='200px'
  text.style.position='absolute'
  text.style.left='700px'
  

})

btn1.addEventListener('click',()=>{
  text.style.display='none'
  
})
let connections = [];
// Create the pin on the SVG element
function createPin(svg, x, y, width = 10, height = 10, pinNumber = '') {
  const pin = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  pin.setAttribute('x', x);
  pin.setAttribute('y', y);
  pin.setAttribute('width', width);
  pin.setAttribute('height', height); 
  pin.setAttribute('fill', 'black');
  pin.setAttribute('class', 'connection-point');
  pin.setAttribute('data-pin', pinNumber); // Data pin number stored here

  // Default stroke color for all pins
  pin.setAttribute('stroke', 'gray');
  pin.setAttribute('stroke-width', 2);

  // If the pin is a digital pin (e.g., pin 5V), change the style
  if (pinNumber === '5v') {
    pin.setAttribute('fill', 'gray'); // You can change this color as desired
    pin.setAttribute('stroke', 'black');
  }

  const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  tooltip.setAttribute('x', x + 12);
  tooltip.setAttribute('y', y);
  tooltip.setAttribute('visibility', 'hidden');
  tooltip.setAttribute('font-size', '14');
  tooltip.setAttribute('fill', 'blue');
  tooltip.textContent = `${pinNumber}`;

  pin.addEventListener('mouseenter', () => tooltip.setAttribute('visibility', 'visible'));
  pin.addEventListener('mouseleave', () => tooltip.setAttribute('visibility', 'hidden'));

  pin.addEventListener('mousedown', (e) => startWire(e, pin));

  svg.appendChild(pin);
  svg.appendChild(tooltip);

  pinsArray.push({
    pinNumber,
    pinElement: pin,
    component: svg.querySelector('image')?.getAttribute('id') || 'unknown'
  });
}

// Modify the createSvgComponent function to add 28 pins to the Arduino



 



let selectedComponent = null; 
let selectedWire = null; 
deleteBtn.addEventListener('click', () => {
  if (selectedComponent) {
    
    deleteComponent(selectedComponent);
    selectedComponent = null; 
  } else if (selectedWire) {
   
    deleteWire(selectedWire);
    selectedWire = null; 
  } else {
    alert('No component or wire selected. Click on a component or wire first to select it for deletion.');
  }
});


function deleteComponent(svg) {
 
  svg.remove();

 
  const componentId = svg.querySelector('image')?.getAttribute('id');


  const wiresToDelete = connections.filter(conn => {
    const startComponent = conn.startPin.closest('svg').querySelector('image')?.getAttribute('id');
    const endComponent = conn.endPin.closest('svg').querySelector('image')?.getAttribute('id');
    return startComponent === componentId || endComponent === componentId;
  });

  wiresToDelete.forEach(conn => {
    conn.wire.remove(); 
  });

 
  connections = connections.filter(conn => {
    const startComponent = conn.startPin.closest('svg').querySelector('image')?.getAttribute('id');
    const endComponent = conn.endPin.closest('svg').querySelector('image')?.getAttribute('id');
    return startComponent !== componentId && endComponent !== componentId;
  });

  
}






function addDeleteListenerToComponent(svg) {
  svg.addEventListener('click', function(e) {
    e.stopPropagation(); 

    selectedComponent = svg;
    selectedWire = null; 
  });
}




// Function to create wires and add delete listener
function createWire(startPin, endPin) {
  const wire = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  wire.setAttribute('x1', startPin.x);
  wire.setAttribute('y1', startPin.y);
  wire.setAttribute('x2', endPin.x);
  wire.setAttribute('y2', endPin.y);
  wire.setAttribute('stroke', 'black');
  wire.setAttribute('stroke-width', 2);

  workspace.appendChild(wire);
  connections.push({ wire, startPin, endPin });

  // Add delete listener to the wire
  addDeleteListenerToWire(wire);
}

// Modify the createSvgComponent function to add the delete listener for components
function createSvgComponent(path, width, height, x = 788, y = 10) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');

  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('class', 'draggable');
  svg.setAttribute('x', x);
  svg.setAttribute('y', y);

  image.setAttribute('href', path);
  image.setAttribute('width', width);
  image.setAttribute('height', height);
  svg.appendChild(image);

  if (path.includes('Arduino')) {
    image.setAttribute('id', 'arduino');
    for (let i = 0; i < 7; i++) {
      createPin(svg, 346 + i * 11, height - 32, 10, 10, `A${i}`);
      createPin(svg, 270 + 10, 268, 11, 10, `5v`);
      createPin(svg, 270 + 24, 268, 11, 10, `GND`);
      createPin(svg, 265, 268, 11, 10, `3v`);
      createPin(svg, 346 + i * 11, 22, 10, 10, `5v`);
      createPin(svg, 234, 22, 10, 10, `13`);
      createPin(svg, 220, 22, 10, 10, `GND`);
    }
  } else if (path.includes('led')) {
    image.style.filter = `brightness(0)`;
    image.setAttribute('id', 'led');
    createPin(svg, width / 2 - 10, 70, 10, 10, 'Cathode');
    createPin(svg, width / 2 + 2, 80, 10, 10, 'Anode');
  } else if (path.includes('buuzer')) {
    createPin(svg, width / 2 - 13, 220, 10, 10, 'Cathode');
    createPin(svg, width / 2 + 1, 220, 10, 10, 'Anode');
  }

  svg.addEventListener('mousedown', startDrag);
  workspace.appendChild(svg);

  // Add delete listener to the created component
  addDeleteListenerToComponent(svg);
}


// components ko dag karne ka logic

function startDrag(e) {
  if (isDrawing) return; 

  activeElement = e.currentTarget;
 
  offsetX = e.clientX - parseInt(activeElement.getAttribute('x'), 10);
  offsetY = e.clientY - parseInt(activeElement.getAttribute('y'), 10);

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
}
// mousemove se componets ko screen me gumane ka logic
function drag(e) {
  if (activeElement) {
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    activeElement.setAttribute('x', x);
    activeElement.setAttribute('y', y);

  
    updateWires(activeElement);
  }
}
// mouseup yaani mouse ko chodhene par drag svg ruk jaye wahi
function stopDrag() {
  activeElement = null;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
}
// wire ko startdrag karne ka logic
function startWire(e, pin) {
  e.stopPropagation();
  isDrawing = true;
console.log(pin)
 
  const workspaceRect = workspace.getBoundingClientRect();
  console.log(workspaceRect)
  const pinRect = pin.getBoundingClientRect();


  const startX = pinRect.x + pin.width.baseVal.value / 2 - workspaceRect.x;
  
  const startY = pinRect.y + pin.height.baseVal.value / 2 - workspaceRect.y;
  
  currentWire = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  currentWire.setAttribute('x1', startX);
  currentWire.setAttribute('y1', startY);
  currentWire.setAttribute('x2', startX);
  currentWire.setAttribute('y2', startY);
 currentWire.setAttribute('stroke', 'blue')
 
  currentWire.setAttribute('stroke-width', 2);
  currentWire.startPin = pin; 

  workspace.appendChild(currentWire);

  workspace.addEventListener('mousemove', drawWire);
  workspace.addEventListener('mouseup', finishWire);
}
// wire ko mousemove par uske x y position badlana taki vo wire ki tarah bada ho sake mousemove par

function drawWire(e) {
  if (isDrawing && currentWire) {
   
    const workspaceRect = workspace.getBoundingClientRect();

    
    const x2 = e.clientX - workspaceRect.x;
    const y2 = e.clientY - workspaceRect.y;
   

    currentWire.setAttribute('x2', x2);
    currentWire.setAttribute('y2', y2);
  }

}
// wire finesh karte wqt x y or posotions ko store karna 
function finishWire(e) {
  isDrawing = false;

  const target = e.target;
 
  if (target.classList.contains('connection-point')) {
    const workspaceRect = workspace.getBoundingClientRect();
    const pinRect = target.getBoundingClientRect();

    const endX = pinRect.x + target.width.baseVal.value / 2 - workspaceRect.x;
    const endY = pinRect.y + target.height.baseVal.value / 2 - workspaceRect.y;

    currentWire.setAttribute('x2', endX);
    currentWire.setAttribute('y2', endY);
    currentWire.endPin = target; 
   
   
    connections.push({
      wire: currentWire,
      startPin: currentWire.startPin,
      endPin: currentWire.endPin,
     
    });
    
    console.log(connections)    
    if(connections.length > 0)
      {
        runCodeSimulation.addEventListener('click',()=>{
          runCode()
        })
      }
  } else {
   
    workspace.removeChild(currentWire);
  }

  workspace.removeEventListener('mousemove', drawWire);
  workspace.removeEventListener('mouseup', finishWire);
  
  currentWire = null;
}
// esme vo logic hai jab componenst par jab wire lag jaye fir components ko drag kiya jaye to wire ke x or y position badle drag  components ke hisab se ye importanat hai 
function updateWires(component) {

  connections.forEach(({ wire, startPin, endPin }) => {
  
    if (component.contains(startPin)) {
      const workspaceRect = workspace.getBoundingClientRect();
      const pinRect = startPin.getBoundingClientRect();
      const x1 = pinRect.x + startPin.width.baseVal.value / 2 - workspaceRect.x;
      const y1 = pinRect.y + startPin.height.baseVal.value / 2 - workspaceRect.y;

      wire.setAttribute('x1', x1);
      wire.setAttribute('y1', y1);
    }

   
    if (component.contains(endPin)) {
      const workspaceRect = workspace.getBoundingClientRect();
      const pinRect = endPin.getBoundingClientRect();
      const x2 = pinRect.x + endPin.width.baseVal.value / 2 - workspaceRect.x;
      const y2 = pinRect.y + endPin.height.baseVal.value / 2 - workspaceRect.y;

      wire.setAttribute('x2', x2);
      wire.setAttribute('y2', y2);
      
    }
  });
}


mainBox.addEventListener('mousedown', (e) => {
  const target = e.target;
  if (target.id === 'led') {
    createSvgComponent('led.png', 100, 100);
  } else if (target.id === 'arduino') {
    createSvgComponent('ArduinoUno.svg.png', 500, 300, 700, 110);
  }
 
})