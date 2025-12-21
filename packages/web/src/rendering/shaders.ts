export const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y; // Flip Y for WebGL texture coordinates
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const CRT_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scanlineIntensity; // 0.0 to 1.0
uniform float u_aberrationOffset;  // in pixels
uniform float u_bloomIntensity;    // 0.0 to 1.0

out vec4 outColor;

// Simple pseudo-random for noise
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = v_uv;
  
  // Chromatic Aberration
  // Sample R, G, B at slightly different offsets
  vec2 distFromCenter = uv - 0.5;
  vec2 aberration = distFromCenter * (u_aberrationOffset / u_resolution);
  
  float r = texture(u_texture, uv - aberration).r;
  float g = texture(u_texture, uv).g;
  float b = texture(u_texture, uv + aberration).b;
  
  vec3 color = vec3(r, g, b);

  // Scanlines
  // Sine wave pattern based on screen height
  float scanline = sin(uv.y * u_resolution.y * 3.14159 * 0.5); 
  // Map -1..1 to 1-intensity..1
  float scanlineFactor = mix(1.0, (scanline + 1.0) * 0.5, u_scanlineIntensity);
  
  color *= scanlineFactor;

  // Simple Bloom / Glow (simulated by boosting bright pixels)
  // This is not a true gaussian blur bloom, but a local contrast boost 
  // combined with the scanline dimming helps pop the brights.
  // True bloom requires multi-pass. For single-pass, we just ensure 
  // bright pixels punch through the scanlines more.
  float brightness = dot(color, vec3(0.299, 0.587, 0.114));
  if (brightness > 0.7) {
    color += color * u_bloomIntensity * (brightness - 0.7);
  }

  // Vignette
  float d = length(distFromCenter);
  float vignette = smoothstep(0.8, 0.4, d); // 0.8 at corner, 0.4 at center
  color *= mix(1.0, vignette, 0.3); // 30% vignette strength

  // Noise / Film Grain (subtle)
  float noise = random(uv + u_time) * 0.05;
  color += noise;

  outColor = vec4(color, 1.0);
}
`;
