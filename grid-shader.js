import * as THREE from 'https://cdn.skypack.dev/three@latest';

var gridShader = {
    side: THREE.DoubleSide,
    transparent: true,
    vertexShader: `

    varying vec3 worldPosition;

void main() {
    worldPosition = position.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `

    varying vec3 worldPosition;

void main() {
    float dist = 1.0 - distance(cameraPosition.xyz, worldPosition.xyz) / 100.0;

    vec2 gridP = abs(fract(worldPosition.xy / 2.0) - 0.5);

    float m = min(gridP.x, gridP.y);

    float al = 1.0 - (m / fwidth(m));

    float alm = al * dist;

    gl_FragColor = vec4(1.0, 0.988235294, 0.976470588, alm);

    if ( gl_FragColor.a <= 0.0 ) discard;
}`
}

export {gridShader as default}