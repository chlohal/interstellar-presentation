import * as THREE from 'https://cdn.skypack.dev/three@latest';

import gridShader from './grid-shader.js';

function SimulatedWorldElement() {
    var self = Reflect.construct(HTMLElement, [], SimulatedWorldElement);
    self.dots = [];
    return self;
}

SimulatedWorldElement.prototype = Object.create(HTMLElement.prototype);
SimulatedWorldElement.prototype.constructor = SimulatedWorldElement;
Object.setPrototypeOf(SimulatedWorldElement, HTMLElement);

SimulatedWorldElement.prototype.averageDotWeight = function(t) {
    let tW = this.dots.map(x=>x.size).reduce((a,b)=>a+b);
    return tW / this.dots.length;
}

SimulatedWorldElement.prototype.averageDotPos = function(t) {
    
    let tW = this.dots.map(x=>x.size).reduce((a,b)=>a+b);
    
    var x = 0;
    var y = 0;
    var z = 0;

    this.dots.forEach(d=>{
        let w = d.size / tW;
        
        x+=d.pos[0](t)*w;
        y+=d.pos[1](t)*w;
        z+=d.pos[2](t)*w;
    });

    return [x,y,z];
}

SimulatedWorldElement.prototype.connectedCallback = function () {

    var box = this.getClientRects()[0];
    this.camera = new THREE.PerspectiveCamera(50, box.width / box.height, 0.1, 1000);

    this.camera.position.x = 10;
    this.camera.position.y = 10;
    this.camera.position.z = -10;

    this.camera.rotation.x = -2.26892803;
    this.camera.rotation.y = 0.698131701;
    this.camera.rotation.z = 2.48709418;

    this.scene = new THREE.Scene();

    const geometry = makeCoolerPlaneGeo(100, 100, 200, 200);

    const material = new THREE.ShaderMaterial(gridShader);


    this.sun = new THREE.DirectionalLight(0xFFFFFF, 1);
    this.sun.position.set(0, 10, 0);
    this.sun.target.position.set(-5, 0, 0);

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    this.plane = plane;

    this.scene.add(plane);
    this.scene.add(this.sun);

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(box.width, box.height);

    parseAndSetupElem(this);

    this.appendChild(this.renderer.domElement);

    renderWhenVisible(this);
    if(this.hasAttribute("distort")) keepDistort(this, geometry);
    
    this.renderer.render(this.scene, this.camera);
}

function makeCoolerPlaneGeo(w, l, dw, dl) {
    var sW = 0 - w/2, eW = w/2;
    var sL = 0 - l/2, eL = l/2;

    var pts = [];

    for(var i = sW; i < eW; i += w/dw) {
        for(var j = sL; j < eL; j += l/dl) {
            var p = [i,j,0];
            var pPx  = [i+w/dw, j, 0];
            var pPy = [i, j+l/dl, 0];
            var pPxy = [i+w/dw, j+l/dl, 0];
            pts.push(...p, ...pPx, ...pPy,
                    ...pPxy, ...pPy, ...pPx);
        }
    }

    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    return g;
}

function parseAndSetupElem(elm) {
    var text = elm.textContent;
    elm.textContent = "";

    var textAsFunc = new Function(text);

    textAsFunc.call(elm);
}

SimulatedWorldElement.prototype.addDot = function(pos, color, size, label) {
    var dot = {};

    var needsAnim = false;
    var posNums = [...pos];
    for(var i = 0; i < pos.length; i++) {
        if(typeof pos[i] === "function") {
            posNums[i] = pos[i](0);
            needsAnim = true;
        } else if(typeof pos[i] === "number") {
            posNums[i] = pos[i] || 0;
            pos[i] = ()=>pos[i];
        } else {
            pos[i] = ()=>0;
            posNums[i] = 0;
        }
    }

    dot.pos = pos;
    
    if(size === undefined) size = 0.25;
    dot.size = size;

    const geometry = new THREE.SphereGeometry(Math.max(0.125, size));
    const material = new THREE.MeshToonMaterial({ color: color || 0xFF6978 });
    dot.sphere = new THREE.Mesh( geometry, material );

    dot.sphere.position.x = posNums[0];
    dot.sphere.position.y = posNums[1];
    dot.sphere.position.z = posNums[2];

    this.scene.add(dot.sphere);
    
    if(label) addDotLabel(dot, label, this);

    this.dots.push(dot);

    if(needsAnim) animDot(this, dot)
}

function addDotLabel(dot, labels, worldElem) {
    var pBox = worldElem.getClientRects()[0];
    
    var labelElem = document.createElement("dl");
    labelElem.classList.add("point-label");

    var labelValues = labels.map(x=>makeAxisLabel(x, labelElem));
    
    cbWhenVisible(worldElem, function(simWorld, t) {
        var screenPos = toScreenXY(dot.sphere.position, worldElem.camera, pBox);
        labelElem.style.transform = `translate(${screenPos.x}px, ${screenPos.y}px)`;

        if(labelValues[0]) labelValues[0].textContent = r5(dot.sphere.position.x);
        if(labelValues[1]) labelValues[1].textContent = r5(dot.sphere.position.y);
        if(labelValues[2]) labelValues[2].textContent = r5(dot.sphere.position.z);

        if(labelValues.length > 3) labelValues[labelValues.length - 1].textContent = Math.round(t/1000);
    });

    worldElem.appendChild(labelElem);
}

function r5(n) {
    return Math.round(n * 100) / 100;
}

function makeAxisLabel(axisName, parent) {
    var caption = document.createElement("dt");
    caption.textContent = axisName + "=";

    var value = document.createElement("dd");
    value.textContent = "0";

    parent.appendChild(caption);
    parent.appendChild(value);

    return value;
}

function toScreenXY( position, camera, box) {

    var pos = position.clone();
    var projScreenMat = new THREE.Matrix4();
    projScreenMat.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    pos.applyMatrix4(projScreenMat);

    return { x: ( pos.x + 1 ) * box.width / 2,
         y: -( pos.y + 1) * box.height / 2 };

}

function keepDistort(simWorld, planeGeo) {
    cbWhenVisible(simWorld, function(s, t) {
        distort(planeGeo, simWorld, t);
    });
}var d = false

function distort(planeGeo,simWorld, t) {
    var dotPos = simWorld.averageDotPos(t);
    var dotWeight = simWorld.averageDotWeight(t) * 100;

    var pts = planeGeo.attributes.position.array;

    var d3 = simWorld.getAttribute("distort") == "3";

    for (var i = 1; i < pts.length; i+= 3) {
        var dis = distance2(pts[i - 1], pts[i], dotPos[0], -dotPos[2]);
        if(d3) dis = Math.sqrt(dis * dis + dotPos[1] * dotPos[1]);

        pts[i + 1] = -dotWeight / (1 + dis);
    }
    d = true;

    // tells Three.js to re-render this mesh
    planeGeo.attributes.position.needsUpdate = true;
    planeGeo.computeVertexNormals();
}

function distance2(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;

    return Math.sqrt(dx*dx + dy*dy);
}

function animDot(simWorld, dot) {
    cbWhenVisible(simWorld, function(s, t) {
        dot.sphere.position.x = dot.pos[0](t);
        dot.sphere.position.y = dot.pos[1](t);
        dot.sphere.position.z = dot.pos[2](t);
        
        
    });
}


function cbWhenVisible(simWorld, cb) {
    var rendering;
    var renderStartTime = 0;

    if(simWorld.observerCbs === undefined) simWorld.observerCbs = [];
    simWorld.observerCbs.push(cb);

    if(simWorld.observer === undefined) {
        simWorld.observer = new IntersectionObserver(function (entries) {
            if (entries[0].intersectionRatio > 0) {
                rendering = true;
                startRendering(-1);
            } else {
                rendering = false;
            }
        });

        var render = (t) => simWorld.observerCbs.forEach(x=>x(simWorld,t));
        var startRendering = function (t) {
            if(t === -1) renderStartTime = -1;
            else if(renderStartTime === -1) renderStartTime = t;

            if (rendering) {
                render(t - renderStartTime);
                requestAnimationFrame(startRendering);
            }
        }
        simWorld.observer.observe(simWorld);
    }

    
}

function renderWhenVisible(simWorld) {
    cbWhenVisible(simWorld, function() {
        simWorld.renderer.render(simWorld.scene, simWorld.camera);
    });
}


export { SimulatedWorldElement as default };
