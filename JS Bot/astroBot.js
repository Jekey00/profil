// Astro Bot – PlayStation-Style, ES-Module, mit Bubble, Outline & Shadow
import * as THREE from "https://unpkg.com/three@0.180.0/build/three.module.js";
import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("astro-bot-canvas");

    // SCENE + CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.4, 4);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    // initial size; will be kept in sync with CSS
    renderer.setSize(160, 160);
    renderer.setPixelRatio(window.devicePixelRatio);

    // color / tone
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // LIGHTS
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(5, 6, 5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x66ccff, 0.7);
    rim.position.set(-5, 4, -5);
    scene.add(rim);

    // MATERIALS
    const whitePlastic = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.25,
        roughness: 0.18
    });

    const blackGloss = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.85,
        roughness: 0.15,
        transparent: true,
        opacity: 0.62 // transparent enough so eyes read through, but still visible
    });

    const blueGlow = new THREE.MeshStandardMaterial({
        color: 0x4fdfff,
        emissive: 0x4fdfff,
        emissiveIntensity: 3.0,
        metalness: 0.1,
        roughness: 0.2
    });

    const jointDark = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.4,
        roughness: 0.3
    });

    // BOT ROOT
    const bot = new THREE.Group();
    bot.scale.set(0.5, 0.5, 0.5);
    scene.add(bot);

    // OUTLINE (PS5-style glow)
    const outline = new THREE.Mesh(
        new THREE.SphereGeometry(1.75, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0x4fdfff,
            transparent: true,
            opacity: 0.18
        })
    );
    outline.material.blending = THREE.AdditiveBlending;
    outline.material.depthWrite = false;
    outline.position.y = 1.2;
    bot.add(outline);

    // BUBBLE (PS5 UI Style)
    const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.06,
            roughness: 0.4,
            metalness: 0.1
        })
    );
    bubble.position.y = 1.2;
    bot.add(bubble);

    // SHADOW PLANE
    const shadowPlane = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 32),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.25
        })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    bot.add(shadowPlane);

    // HEAD (group)
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 48, 48),
        whitePlastic
    );
    head.position.y = 1.9;
    bot.add(head);

    // VISOR – shaped as a front cap of a sphere, slightly behind eyes but semi-transparent
    const visor = new THREE.Mesh(
        new THREE.SphereGeometry(0.58, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.85,
            roughness: 0.15,
            transparent: false,
            opacity: 0.88
            
        }),
        blackGloss
    );


    visor.position.set(0, 0.05, 0.15);
    head.add(visor);

    // EYES – further forward than visor so they are clearly visible through/over it
    const eyeMat = new THREE.MeshStandardMaterial({
        color: 0x4fdfff,
        emissive: 0x4fdfff,
        emissiveIntensity: 4.0
    });

    function createEye(x) {
        const eye = new THREE.Mesh(
            new THREE.CircleGeometry(0.1, 24),
            eyeMat
        );
        // place eyes noticeably in front of visor (higher z)
        eye.position.set(x, 0.22, 0.9);
        // ensure eyes render on top visually by slightly increasing renderOrder
        eye.renderOrder = 2;
        return eye;
    }

    const leftEye = createEye(-0.18);
    const rightEye = createEye(0.18);
    head.add(leftEye, rightEye);

    // BODY
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.38, 0.65, 10, 20),
        whitePlastic
    );
    body.position.y = 1.05;
    bot.add(body);

    // CHEST LIGHT
    const chestLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.12, 0.05),
        blueGlow
    );
    chestLight.position.set(0, 1.1, 0.35);
    bot.add(chestLight);

    // ARMS
    function createArm(x) {
        const arm = new THREE.Group();

        const upper = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.12, 0.35, 8, 16),
            whitePlastic
        );
        upper.position.set(x, 1.25, 0);

        const joint = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 16, 16),
            jointDark
        );
        joint.position.set(x, 1.05, 0);

        const lower = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.1, 0.35, 8, 16),
            whitePlastic
        );
        lower.position.set(x, 0.85, 0);

        arm.add(upper, joint, lower);
        return arm;
    }

    bot.add(createArm(-0.6), createArm(0.6));

  

    // ANIMATION STATE
    let t = 0;
    let blinkTimer = 0;
    let nextBlink = 2 + Math.random() * 4;

    const baseLeftEyePos = leftEye.position.clone();
    const baseRightEyePos = rightEye.position.clone();

    // HEAD smoothing targets
    let headTargetY = 0;
    let headTargetX = 0;

    // Resize helper to match CSS size and devicePixelRatio
    function resizeRendererToDisplaySize() {
        const width = canvas.clientWidth || 320;
        const height = canvas.clientHeight || 320;
        const needResize = canvas.width !== Math.floor(width * window.devicePixelRatio) ||
            canvas.height !== Math.floor(height * window.devicePixelRatio);
        if (needResize) {
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
        return needResize;
    }

    // ANIMATION LOOP
    function animate() {
        requestAnimationFrame(animate);
        t += 0.015;

        // keep renderer size in sync with CSS
        resizeRendererToDisplaySize();

        // subtle hover float
        bot.position.y = Math.sin(t) * 0.09;

        // smooth head rotation toward target (lerp)
        // small damping for natural motion
        head.rotation.y += (headTargetY - head.rotation.y) * 0.12;
        head.rotation.x += (headTargetX - head.rotation.x) * 0.12;

        // Blinking
        blinkTimer += 0.015;
        if (blinkTimer > nextBlink) {
            leftEye.scale.y = rightEye.scale.y = 0.08;
            setTimeout(() => {
                leftEye.scale.y = rightEye.scale.y = 1;
            }, 120);
            blinkTimer = 0;
            nextBlink = 2 + Math.random() * 4;
        }

        renderer.render(scene, camera);
    }

    animate();

    // FAST HEAD + EYE TRACKING (mouse)
    document.addEventListener("mousemove", e => {
        // normalized -0.5..0.5 -> -1..1
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = -(e.clientY / window.innerHeight - 0.5) * 2;

        // head target (scaled down)
        headTargetY = nx * 0.28; // yaw
        headTargetX = ny * 0.18; // pitch

        // eyes follow more strongly (local positions)
        const eyeXOffset = nx * 0.32;
        const eyeYOffset = ny * 0.20;

        // lerp eyes for smoothness
        leftEye.position.x += (baseLeftEyePos.x + eyeXOffset - leftEye.position.x) * 0.20;
        rightEye.position.x += (baseRightEyePos.x + eyeXOffset - rightEye.position.x) * 0.20;

        leftEye.position.y += (baseLeftEyePos.y + eyeYOffset - leftEye.position.y) * 0.20;
        rightEye.position.y += (baseRightEyePos.y + eyeYOffset - rightEye.position.y) * 0.20;

        leftEye.position.z += (baseLeftEyePos.z + eyeYOffset - leftEye.position.z) * 0.20;
        rightEye.position.z += (baseRightEyePos.z + eyeYOffset - rightEye.position.z) * 0.20;
    });

    // Optional: keep eyes centered again when mouse leaves window
    window.addEventListener("mouseleave", () => {
        headTargetY = 0;
        headTargetX = 0;
        headTargetZ = 0;
        // lerp back to base positions
        leftEye.position.x += (baseLeftEyePos.x - leftEye.position.x) * 0.20;
        rightEye.position.x += (baseRightEyePos.x - rightEye.position.x) * 0.20;

        leftEye.position.y += (baseLeftEyePos.y - leftEye.position.y) * 0.20;
        rightEye.position.y += (baseRightEyePos.y - rightEye.position.y) * 0.20;

        leftEye.position.z += (baseLeftEyePos.z - leftEye.position.z) * 0.20;
        rightEye.position.z += (baseRightEyePos.z - rightEye.position.z) * 0.20;
    });

    

    document.addEventListener("DOMContentLoaded", () => {

        const botContainer = document.getElementById("bot-container");
        const botChat = document.getElementById("bot-chat");

        // Chat toggle
        botContainer.addEventListener("click", () => {
            const isOpen = botChat.style.display === "block";
            botChat.style.display = isOpen ? "none" : "block";
        });

        // n8n Chat direkt in unseren Container laden
        createChat({
            webhookUrl: 'https://dessie-glossiest-desiredly.ngrok-free.dev/webhook/ecd08f35-6580-40c6-8f88-a18766819dee/chat',
            parent: '#n8n-chat-container', // Statt automatisch die Bubble zu erstellen
            showFloatingButton: false // Bubble komplett deaktivieren
        });
    });



});
