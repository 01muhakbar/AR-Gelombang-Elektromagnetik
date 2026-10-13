// app.js

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById('start-btn');
    const startScreen = document.getElementById('start-screen');
    const errorMsg = document.getElementById('error-msg');
    const arUI = document.getElementById('ar-ui');
    const backBtn = document.getElementById('back-btn');
    const toastNotification = document.getElementById('toast-notification');
    const toastText = document.getElementById('toast-text');
    const arScene = document.getElementById('ar-scene');

    // UI Elements for Simulation
    const btnSimulasi = document.getElementById('btn-simulasi');
    const simulationOverlay = document.getElementById('simulation-overlay');
    const simIframe = document.getElementById('sim-iframe');
    const closeSimulasi = document.getElementById('close-simulasi');
    const controlsContainer = document.getElementById('controls-container');
    const simTitle = document.querySelector('#simulation-overlay h3');

    // Pemetaan data model berdasarkan Index
    const modelData = {
        0: { name: "Gelombang Transversal" },
        1: { name: "Gelombang Longitudinal" },
        2: { name: "Rapatan dan Renggangan" },
        3: { name: "Polarisasi" },
        4: { name: "Interferensi Konstruktif" },
        5: { name: "Interferensi Destruktif" },
        6: { name: "Interferensi Celah Ganda" },
        7: { name: "Seismograf" },
        8: { name: "Ultrasonografi (USG)" },
        9: { name: "Kereta Maglev" }
    };

    let activeTarget = null;
    let loseTimeouts = {}; // Menyimpan timeout untuk debounce targetLost

    // Inisialisasi Environment (Tombol Mulai AR)
    startBtn.addEventListener('click', () => {
        // Ubah state tombol menjadi loading
        startBtn.textContent = "Memuat AR...";
        startBtn.disabled = true;
        errorMsg.style.display = 'none';

        // Mulai mesin AR secara langsung (MindAR akan menangani izin kamera & loading target)
        if(arScene.systems["mindar-image-system"]) {
            arScene.systems["mindar-image-system"].start();
        } else {
            console.error("Sistem MindAR belum siap!");
            errorMsg.style.display = 'block';
            startBtn.textContent = "Mulai AR";
            startBtn.disabled = false;
        }
    });

    // UI Elements for Interactive Zoom
    const zoomWidget = document.getElementById('zoom-widget');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const zoomValEl = document.getElementById('zoom-value');

    let currentScaleMultiplier = 1.0;
    const baseScales = {
        'target-0': 0.16,
        'target-1': 0.16,
        'target-2': 0.25
    };

    function applyZoom() {
        if (zoomValEl) {
            zoomValEl.textContent = `${Math.round(currentScaleMultiplier * 100)}%`;
        }
        document.querySelectorAll('.ar-model').forEach(model => {
            const parentTarget = model.closest('[mindar-image-target]');
            const base = (parentTarget && baseScales[parentTarget.id]) ? baseScales[parentTarget.id] : 0.16;
            const s = (base * currentScaleMultiplier).toFixed(3);
            model.setAttribute('scale', `${s} ${s} ${s}`);
        });
    }

    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentScaleMultiplier < 2.5) {
                currentScaleMultiplier = Math.min(2.5, +(currentScaleMultiplier + 0.25).toFixed(2));
                applyZoom();
            }
        });
    }

    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentScaleMultiplier > 0.5) {
                currentScaleMultiplier = Math.max(0.5, +(currentScaleMultiplier - 0.25).toFixed(2));
                applyZoom();
            }
        });
    }

    if (btnZoomReset) {
        btnZoomReset.addEventListener('click', (e) => {
            e.stopPropagation();
            currentScaleMultiplier = 1.0;
            applyZoom();
        });
    }

    // Menangani Event Kesiapan Sistem AR
    arScene.addEventListener("arReady", () => {
        console.log("Mesin AR Siap dan Kamera Menyala");
        // Sembunyikan layar awal dan tampilkan tombol kembali setelah kamera menyala
        startScreen.style.display = 'none';
        if (arUI) arUI.style.display = 'block';
        if (zoomWidget) zoomWidget.style.display = 'flex';
    });

    // Menangani Event Tombol Kembali (Keluar dari AR)
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            console.log("Menghentikan AR dan kembali ke halaman awal");
            
            // Hentikan sistem MindAR
            if (arScene.systems["mindar-image-system"]) {
                arScene.systems["mindar-image-system"].stop();
            }
            
            // Atur ulang UI
            arUI.style.display = 'none';
            if (zoomWidget) zoomWidget.style.display = 'none';
            currentScaleMultiplier = 1.0;
            applyZoom();
            controlsContainer.classList.add('hidden');
            btnSimulasi.style.display = 'none';
            toastNotification.classList.add('hidden');
            
            // Kembalikan tombol mulai
            startBtn.textContent = "Mulai AR";
            startBtn.disabled = false;
            
            // Tampilkan kembali layar awal
            startScreen.style.display = 'flex';
        });
    }

    arScene.addEventListener("arError", (event) => {
        console.error("Gagal memulai AR:", event);
        // Tampilkan pesan error jika kamera ditolak atau target.mind gagal diunduh
        errorMsg.style.display = 'block';
        startBtn.textContent = "Coba Lagi";
        startBtn.disabled = false;
    });

    // =========================================================================
    // HIGH-CONTRAST SELF-ILLUMINATED TEXT BADGE SYSTEM
    // Mengubah tekstur teks bawaan model 3D menjadi badge kapsul berpendar terang
    // agar kontras 100% di atas kartu fisik & QR Code
    // =========================================================================
    function createTextBadgeTexture(text, width, height, textColor, borderColor) {
        const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
        if (!THREE) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = width * 2; // 2x Retina Supersampling untuk ketajaman tinggi di layar HP
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);

        // Desain Plat Kapsul Gelap (Memblokir Noise QR Code & Kartu)
        const padX = 8;
        const padY = 6;
        const boxW = width - padX * 2;
        const boxH = height - padY * 2;
        const r = boxH * 0.42;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)'; // Dark Navy Glossy
        ctx.strokeStyle = borderColor || 'rgba(56, 189, 248, 0.9)';
        ctx.lineWidth = 3;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(padX, padY, boxW, boxH, r);
        } else {
            ctx.moveTo(padX + r, padY);
            ctx.lineTo(padX + boxW - r, padY);
            ctx.arcTo(padX + boxW, padY, padX + boxW, padY + r, r);
            ctx.lineTo(padX + boxW, padY + boxH - r);
            ctx.arcTo(padX + boxW, padY + boxH, padX + boxW - r, padY + boxH, r);
            ctx.lineTo(padX + r, padY + boxH);
            ctx.arcTo(padX, padY + boxH, padX, padY + boxH - r, r);
            ctx.lineTo(padX, padY + r);
            ctx.arcTo(padX, padY, padX + r, padY, r);
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();

        // Tipografi Bold Bersinar
        ctx.fillStyle = textColor || '#ffffff';
        const fontSize = Math.round(height * 0.44);
        ctx.font = `bold ${fontSize}px 'Inter', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = false; // Memperbaiki orientasi agar teks tidak terbalik (sesuai konvensi glTF UV)
        if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
        texture.needsUpdate = true;
        return texture;
    }

    const textBadgeConfigs = {
        'Gelombang Transversal': { text: 'Gelombang Transversal', w: 777, h: 100, color: '#38bdf8', border: 'rgba(56, 189, 248, 0.9)' },
        'Gelombang Longitudinal': { text: 'Gelombang Longitudinal', w: 777, h: 100, color: '#38bdf8', border: 'rgba(56, 189, 248, 0.9)' },
        'Arah Getar': { text: 'Arah Getar', w: 375, h: 100, color: '#f87171', border: 'rgba(239, 68, 68, 0.9)' },
        'Arah Rambat': { text: 'Arah Rambat', w: 444, h: 100, color: '#fde047', border: 'rgba(250, 204, 21, 0.9)' },
        'Garis Keseimbangan': { text: 'Garis Keseimbangan', w: 682, h: 100, color: '#ffffff', border: 'rgba(148, 163, 184, 0.9)' },
        'Arah getar sejajar arah rambat': { text: 'Arah Getar Sejajar Arah Rambat', w: 682, h: 100, color: '#38bdf8', border: 'rgba(56, 189, 248, 0.9)' }
    };

    function upgradeModelTextMaterials(modelEl) {
        const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
        if (!THREE || !modelEl) return;
        const mesh = modelEl.getObject3D('mesh');
        if (!mesh) return;

        mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const mat = Array.isArray(child.material) ? child.material[0] : child.material;
                const matName = mat && mat.name ? mat.name.trim() : '';
                const nodeName = child.name ? child.name.trim() : '';

                // Fuzzy match agar cocok meskipun nama memiliki prefix/suffix dari Three.js
                let conf = textBadgeConfigs[matName] || textBadgeConfigs[nodeName];
                if (!conf) {
                    for (const key in textBadgeConfigs) {
                        if ((matName && matName.includes(key)) || (nodeName && nodeName.includes(key))) {
                            conf = textBadgeConfigs[key];
                            break;
                        }
                    }
                }

                if (conf && !child.userData.badgeUpgraded) {
                    const badgeTex = createTextBadgeTexture(conf.text, conf.w, conf.h, conf.color, conf.border);
                    if (badgeTex) {
                        // Gunakan MeshBasicMaterial agar mandiri 100% tanpa bayangan gelap
                        child.material = new THREE.MeshBasicMaterial({
                            map: badgeTex,
                            transparent: true,
                            depthWrite: false,
                            depthTest: true,
                            side: THREE.DoubleSide
                        });
                        child.renderOrder = 999; // Selalu dirender di atas garis gelombang
                        child.position.z += 0.03;
                        child.userData.badgeUpgraded = true;
                    }
                }
            }
        });
    }

    // Pasang listener pada model 3D saat file GLTF selesai dimuat
    document.querySelectorAll('a-gltf-model').forEach(modelEl => {
        modelEl.addEventListener('model-loaded', () => {
            upgradeModelTextMaterials(modelEl);
        });
        if (modelEl.getObject3D('mesh')) {
            upgradeModelTextMaterials(modelEl);
        }
    });

    // Safety Poller: Memastikan material teks ter-upgrade bahkan jika dimuat secara asinkron
    let pollCount = 0;
    const upgradePoller = setInterval(() => {
        document.querySelectorAll('.ar-model').forEach(upgradeModelTextMaterials);
        pollCount++;
        if (pollCount > 20) clearInterval(upgradePoller);
    }, 200);

    // Menangani Event Lifecycle Object 3D
    const targets = document.querySelectorAll('[mindar-image-target]');
    
    targets.forEach((target) => {
        // A-Frame mem-parsing atribut komponen menjadi objek, jadi split() akan gagal.
        // Cara paling aman adalah mengambil angka dari atribut ID (misal: "target-0" -> "0")
        const targetIndex = target.id.split('-')[1]; 

        target.addEventListener("targetFound", event => {
            console.log(`Target ${targetIndex} ditemukan`);
            
            // Hapus timeout debounce jika ada (user mengarahkan kembali ke marker dengan cepat)
            if (loseTimeouts[targetIndex]) {
                clearTimeout(loseTimeouts[targetIndex]);
                delete loseTimeouts[targetIndex];
            }

            // State Management: Batasi animasi kompleks 
            // Jika ada target lain yang aktif, kita bisa menjedanya atau menonaktifkannya
            if (activeTarget !== null && activeTarget !== targetIndex) {
                console.log(`Menghentikan target ${activeTarget} untuk prioritas memori`);
                // Logika mematikan animasi target sebelumnya bisa disisipkan di sini
            }
            activeTarget = targetIndex;

            // Tampilkan aset (gltf) di dalamnya
            const model = target.querySelector('.ar-model');
            if (model) {
                model.setAttribute('visible', 'true');
                // Panggil animasi looping dari aframe-extras
                model.setAttribute('animation-mixer', 'clip: *; loop: repeat');
                upgradeModelTextMaterials(model);
                applyZoom();
            }

            // Tampilkan tombol simulasi khusus untuk Index 0 dan 1
            if (targetIndex === "0" || targetIndex === "1") {
                controlsContainer.classList.remove('hidden');
                btnSimulasi.style.display = 'block';
            }

            // Tampilkan UI Infografis
            const infoName = modelData[targetIndex] ? modelData[targetIndex].name : "Objek " + targetIndex;
            toastText.textContent = `Model Terdeteksi: ${infoName}`;
            toastNotification.classList.remove('hidden');
        });

        target.addEventListener("targetLost", event => {
            console.log(`Target ${targetIndex} hilang`);
            
            // Debounce / Delay 500ms - 1000ms untuk mencegah flickering
            loseTimeouts[targetIndex] = setTimeout(() => {
                const model = target.querySelector('.ar-model');
                if (model) {
                    model.setAttribute('visible', 'false');
                    // Hentikan animasi
                    model.removeAttribute('animation-mixer');
                }
                
                // Sembunyikan UI simulasi jika yang hilang adalah target yang memilikinya
                if (targetIndex === "0" || targetIndex === "1") {
                    controlsContainer.classList.add('hidden');
                    btnSimulasi.style.display = 'none';
                }
                
                // Sembunyikan Toast
                toastNotification.classList.add('hidden');
                
                if (activeTarget === targetIndex) {
                    activeTarget = null;
                }
            }, 750); // Waktu jeda (delay) 750ms
        });
    });

    // Event Listener untuk Buka/Tutup Simulasi
    if(btnSimulasi && simulationOverlay && closeSimulasi && simIframe) {
        btnSimulasi.addEventListener('click', () => {
            // Arahkan iframe dan judul sesuai dengan target yang sedang aktif
            if (activeTarget === "0") {
                simIframe.src = "./assets/models/simulasi-gelombang-transversal.html";
                if(simTitle) simTitle.textContent = "Simulasi Gelombang Transversal";
            } else if (activeTarget === "1") {
                simIframe.src = "./assets/models/simulasi-gelombang-longitudinal.html";
                if(simTitle) simTitle.textContent = "Simulasi Gelombang Longitudinal";
            }
            simulationOverlay.style.display = 'flex';
        });

        closeSimulasi.addEventListener('click', () => {
            simulationOverlay.style.display = 'none';
            // Kosongkan src untuk menghentikan proses di dalam iframe jika ditutup
            simIframe.src = ""; 
        });
    }
});
