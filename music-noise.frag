uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D textureAudioData;

const float SPEED = 0.02;
const float MUSIC_SCALE = 0.5;
const float MOUSE_SCALE = 0.1;
const float PERSISTENCE = 0.5;
const float SCALE = 0.2;
const int OCTAVES = 6;

const vec3 color1 = vec3(0.125, 0.141, 0.149);
const vec3 color2 = vec3(0.423, 0.450, 0.239);
const vec3 color3 = vec3(0.549, 0.549, 0.533);
const vec3 color4 = vec3(0.615, 0.650, 0.364);
const vec3 color5 = vec3(0.949, 0.949, 0.949);
const int NUM_COLORS = 5;

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  // Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

// END Simplex 3D Noise  

// Fractional Brownion Motion function based on:
// https://cmaher.github.io/posts/working-with-simplex-noise/

float fbm(
    vec3 position,
    float persistence, 
    float scale
  ) {
  float maxAmp = 0.0;
  float amp = 1.0;
  float freq = scale;
  float noise = 0.0;
  float lacunarity = 2.0;

  for(int i = 0; i < OCTAVES; i++) {
    noise += snoise(position * freq) * amp;
    maxAmp += amp;
    amp *= persistence;
    freq *= lacunarity;
  }

  return noise / maxAmp ;
}


void main(){
  // get the normalized position
  vec2 pos = gl_FragCoord.xy / u_resolution;
  // get the normalized mouse position scaled, and with the y axis inverted
  vec2 mousePos = u_mouse / u_resolution * MOUSE_SCALE * vec2(1., -1.);

  // get the noise value at our given spot in space and time
  float value = fbm(
    vec3(pos + mousePos, u_time * SPEED),
    PERSISTENCE,
    SCALE
  ) * 0.5 + 0.5;

  // use the noise value to choose which audio bar we're grabbing from
  float audioLevel = texture2D(
    textureAudioData, 
    vec2(value * MUSIC_SCALE, 1.0)
  ).a;

  // smoothly transition between the colors based on the value of the audio bar
  float step = 1.0 / float(NUM_COLORS);
  vec3 color = mix(color1, color2, smoothstep(0.0, step, audioLevel));
  color = mix(color, color3, smoothstep(step, step * 2.0, audioLevel));
  color = mix(color, color4, smoothstep(step * 2.0, step * 3.0, audioLevel));
  color = mix(color, color5, smoothstep(step * 3.0, step * 4.0, audioLevel));

  // output the color
  gl_FragColor = vec4(color, 1.0);
}