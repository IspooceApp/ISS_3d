varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;

uniform vec3 sunDirection;

void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    vNormal = normalMatrix * normal;
    vSunDir = mat3(viewMatrix) * sunDirection;

    gl_Position = projectionMatrix * mvPosition;
}