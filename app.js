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

    // Menangani Event Kesiapan Sistem AR
    arScene.addEventListener("arReady", () => {
        console.log("Mesin AR Siap dan Kamera Menyala");
        // Sembunyikan layar awal dan tampilkan tombol kembali setelah kamera menyala
        startScreen.style.display = 'none';
        if (arUI) arUI.style.display = 'block';
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
