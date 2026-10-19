/**
 * Print Engine - A4 PDF Precision Print Coordinator
 * Mengatur margin A4: Atas 20mm, Bawah 20mm, Kiri 10mm, Kanan 10mm
 * Running header dan running footer otomatis dengan nomor halaman
 */

window.PrintEngine = (function() {
  function printDocument(targetElementId, documentTitle = "") {
    const originalTitle = document.title;
    // Kosongkan document.title selama proses cetak agar peramban TIDAK mencetak nama menu atau jam di header PDF
    document.title = "\u200E";

    // Tampilkan animasi loading agar pengguna tahu proses cetak telah aktif
    if (window.App && window.App.showLoading) {
      window.App.showLoading(
        "Menyiapkan Dokumen Cetak A4...", 
        "Mengatur tata letak margin presisi A4 dan membersihkan header peramban..."
      );
    }

    const targetEl = document.getElementById(targetElementId);
    const proj = (window.ProjectManager && window.ProjectManager.getActiveProject()) || {};

    // Pastikan seluruh elemen SVG memiliki lebar yang responsif untuk cetak
    if (targetEl) {
      const svgs = targetEl.querySelectorAll('svg');
      svgs.forEach(svg => {
        svg.setAttribute('width', '100%');
        svg.style.maxWidth = '100%';
      });
    }

    // Dukungan Orientasi Landscape Otomatis untuk Kurva S & Kalender Proyek
    const isLandscape = (targetElementId === "panel-kurva-s" || targetElementId === "panel-kalender");
    if (isLandscape) {
      let dynStyle = document.getElementById("dynamicLandscapePrintStyle");
      if (!dynStyle) {
        dynStyle = document.createElement("style");
        dynStyle.id = "dynamicLandscapePrintStyle";
        document.head.appendChild(dynStyle);
      }
      dynStyle.innerHTML = `
        @media print {
          @page {
            size: A4 landscape !important;
            margin-top: 10mm !important;
            margin-bottom: 12mm !important;
            margin-left: 12mm !important;
            margin-right: 12mm !important;
          }
        }
      `;
    }

    const cleanup = () => {
      document.body.classList.remove("printing-batch");
      document.title = originalTitle;
      const dyn = document.getElementById("dynamicLandscapePrintStyle");
      if (dyn) dyn.remove();
      if (window.App && window.App.hideLoading) {
        window.App.hideLoading();
      }
    };

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('afterprint', cleanup, { once: true });
    }

    // Sembunyikan loader visual SEBELUM memanggil window.print()
    setTimeout(() => {
      if (window.App && window.App.hideLoading) {
        window.App.hideLoading();
      }
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.warn("window.print error:", err);
        }
        document.title = originalTitle;
        cleanup();
      }, 60);
    }, 280);
  }

  // Cetak Dokumen Terisolasi via Hidden Iframe (Mencegah 100% Kebocoran Data & Menghilangkan Header Peramban)
  function printViaHiddenIframe(htmlContent, docTitle = "") {
    if (window.App && window.App.showLoading) {
      window.App.showLoading(
        "Menyiapkan Dokumen Cetak A4...",
        "Menyusun tata letak presisi A4 tanpa footage header atau nama menu..."
      );
    }

    let printFrame = document.getElementById("appPrintIframe");
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "appPrintIframe";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "1024px";
      printFrame.style.height = "768px";
      printFrame.style.border = "none";
      printFrame.style.opacity = "0.01";
      printFrame.style.zIndex = "-9999";
      printFrame.style.pointerEvents = "none";
      document.body.appendChild(printFrame);
    }

    const frameDoc = (printFrame.contentWindow && printFrame.contentWindow.document) || printFrame.contentDocument;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=1024">
        <title>\u200E</title>
        <link rel="stylesheet" href="css/theme.css">
        <link rel="stylesheet" href="css/main.css">
        <link rel="stylesheet" href="css/print-a4.css">
        <style>
          .print-only { display: block !important; visibility: visible !important; }
          .no-print, .btn, .btn-group, .page-header-actions, .d-mobile-only { display: none !important; }
          .d-desktop-only, table.d-desktop-only { display: table !important; }
          div.d-desktop-only { display: block !important; }
          ${htmlContent.includes('proposal-page') ? `
                    @page {
            size: A4 portrait;
            margin-top: 1.0cm !important;
            margin-bottom: 1.0cm !important;
            margin-left: 2.0cm !important;
            margin-right: 1.0cm !important;
            margin: 1.0cm 1.0cm 1.0cm 2.0cm !important;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
            @bottom-right { content: none !important; }
          }
          @page coverPage {
            size: A4 portrait;
            margin-top: 1.0cm !important;
            margin-bottom: 1.0cm !important;
            margin-left: 2.0cm !important;
            margin-right: 1.0cm !important;
            margin: 1.0cm 1.0cm 1.0cm 2.0cm !important;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
            @bottom-right { content: none !important; }
          }
          @page proposalPage {
            size: A4 portrait;
            margin-top: 1.0cm !important;
            margin-bottom: 1.0cm !important;
            margin-left: 2.0cm !important;
            margin-right: 1.0cm !important;
            margin: 1.0cm 1.0cm 1.0cm 2.0cm !important;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
            @bottom-right { content: none !important; }
          }
          ` : htmlContent.includes('printable-bap-doc') ? `
          @page {
            size: A4 portrait;
            margin-top: 20mm !important;
            margin-bottom: 15mm !important;
            margin-left: 12mm !important;
            margin-right: 12mm !important;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
            @bottom-right { content: none !important; }
          }
          ` : `
          @page {
            size: A4 portrait;
            margin-top: 10mm;
            margin-bottom: 14mm;
            margin-left: 10mm;
            margin-right: 10mm;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left {
              content: "Dokumen Resmi Proyek • Standar SE PUPR No. 47/2026";
              font-size: 8pt;
              color: #64748b;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            @bottom-center { content: none !important; }
            @bottom-right {
              content: "Halaman " counter(page) " dari " counter(pages);
              font-size: 8pt;
              font-weight: 700;
              color: #334155;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
          }
          ` }

          @page coverPage {
            size: A4 portrait;
            margin-top: 1.0cm !important;
            margin-bottom: 1.0cm !important;
            margin-left: 2.0cm !important;
            margin-right: 1.0cm !important;
            margin: 1.0cm 1.0cm 1.0cm 2.0cm !important;
            @top-right { content: none !important; }
            @bottom-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
          }
          .cover-page {
            page: coverPage;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .proposal-page.content-page:first-of-type {
            counter-reset: page 1;
          }
          .proposal-footer {
            display: none !important;
          }
                    .proposal-page {
            width: 180mm !important;
            max-width: 180mm !important;
            height: 277mm !important;
            min-height: 277mm !important;
            max-height: 277mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            position: relative !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .proposal-page .print-footer-block {
            margin-top: auto !important;
            padding-top: 4px !important;
            border-top: none !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
            font-size: 8pt !important;
            color: #475569 !important;
            width: 100% !important;
            flex-shrink: 0 !important;
            box-sizing: border-box !important;
          }
          .cover-page,
          .proposal-page.cover-page {
            width: 180mm !important;
            max-width: 180mm !important;
            height: 277mm !important;
            min-height: 277mm !important;
            max-height: 277mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            border: none !important;
            box-shadow: none !important;
          }
          .cover-inner-border {
            width: 100% !important;
            height: 100% !important;
            max-height: 275mm !important;
            box-sizing: border-box !important;
            border: 2px solid #0a2e5c !important;
            border-top: 2px solid #0a2e5c !important;
            border-right: 2px solid #0a2e5c !important;
            border-bottom: 2px solid #0a2e5c !important;
            border-left: 2px solid #0a2e5c !important;
            outline: none !important;
            padding: 16px 20px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            position: relative !important;
          }
          .cover-header-top {
            text-align: center !important;
            margin-top: 10mm !important;
          }
          .cover-title-divider {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            border: none !important;
            margin: 0 !important;
          }
          .page-heading h2 {
            font-size: 12pt !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            margin-bottom: 8pt !important;
            border: none !important;
            border-bottom: none !important;
            text-decoration: none !important;
          }
          .page-heading {
            border: none !important;
            border-bottom: none !important;
          }
          .heading-line {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            border: none !important;
            margin: 0 !important;
          }
          .proposal-preview-wrapper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .printable-bap-doc {
            width: 100% !important;
            max-width: 186mm !important;
            margin: 0 auto !important;
            min-height: 245mm !important;
            height: auto !important;
            max-height: 255mm !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
            position: relative !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            border: none !important;
            box-shadow: none !important;
          }
          .printable-bap-doc:last-child {
            page-break-after: auto !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 9pt !important;
          }

          .table th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      if (window.App && window.App.hideLoading) {
        window.App.hideLoading();
      }
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        console.warn("Iframe print fallback error:", err);
        try {
          window.print();
        } catch (e) {
          console.error("Direct window print error:", e);
        }
      }
    }, 450);
  }

  function createPrintHeader(arg1, arg2 = "RENCANA ANGGARAN BIAYA", arg3 = {}) {
    let proj = {};
    let docType = "RENCANA ANGGARAN BIAYA";
    let extraInfo = {};

    if (typeof arg1 === 'string') {
      docType = arg1;
      proj = arg2 || {};
      extraInfo = arg3 || {};
    } else {
      proj = arg1 || {};
      docType = (typeof arg2 === 'string') ? arg2 : "RENCANA ANGGARAN BIAYA";
      extraInfo = (typeof arg3 === 'object') ? arg3 : {};
    }

    const projName = proj.name || proj.nama || "Pembangunan Rumah Tinggal Baru";
    const projLoc = proj.location || proj.lokasi || "Bandung, Jawa Barat";
    const projOwner = proj.owner || proj.pemilik || "Pemberi Tugas";
    const durDays = proj.durationDays || proj.durasi || 180;
    const durWeeks = Math.ceil(durDays / 7);
    const startStr = proj.startDate || proj.tanggalMulai || "2026-04-01";
    const finishStr = proj.finishDate || proj.tanggalSelesai || "2026-09-27";
    const regionStr = proj.regionName || proj.daerahAcuan || "Jawa Barat - Bandung Raya & Priangan (1.04x)";
    const contractorStr = proj.contractor || proj.kontraktor || "Dutamik.id";
    const docNumStr = proj.docNumber || proj.nomorDokumen || proj.kodeRegistrasi || "RAB/2026/001";
    const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const rawLabor = extraInfo.totalLaborQty || proj.totalLaborQty || proj.estimasiTenagaOH;
    let laborInfoStr = rawLabor 
      ? `${Number(rawLabor).toFixed(1)} OH (~${(rawLabor / durDays).toFixed(1)} Org/Hari)`
      : "Sesuai Analisis AHSP 2026";

    const defaultLogoSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 302 342' width='302' height='342'><path d='M 23 163 L 23 150 L 150 21 L 278 150 L 278 163' fill='none' stroke='%23000000' stroke-width='13' stroke-linecap='round' stroke-linejoin='round'/><path d='M 44 155 L 44 317 L 110 317 L 110 220 A 40 40 0 0 1 190 220 L 190 317 L 256 317 L 256 155' fill='none' stroke='%23000000' stroke-width='13' stroke-linecap='round' stroke-linejoin='round'/></svg>";
    const logoSrc = (proj.logo && typeof proj.logo === 'string' && proj.logo.trim().length > 10) ? proj.logo : defaultLogoSvg;
    const logoSize = Math.max(40, Math.min(300, Number(proj.logoSize) || 60));
    const logoHtml = `
      <div class="print-header-logo-container" style="flex: 0 0 auto; margin-right: 14px; display: flex; align-items: center;">
        <img src="${logoSrc}" alt="Logo Proyek" style="width: ${logoSize}px !important; max-width: ${logoSize}px !important; max-height: ${Math.round(logoSize * 0.75)}px !important; object-fit: contain !important; display: block !important;">
      </div>
    `;

    return `
      <div class="print-header-block">
        <div class="print-header-top" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; max-width: 65%;">
            ${logoHtml}
            <div class="print-header-logo-text">
              <span class="company-brand">${contractorStr}</span>
              <span class="company-sub">Sistem Informasi Perencanaan, Estimasi Biaya &amp; Manajemen Konstruksi</span>
            </div>
          </div>
          <div class="print-header-meta">
            <div><strong>No. Dokumen:</strong> ${docNumStr}</div>
            <div><strong>Tanggal Cetak:</strong> ${printDate}</div>
          </div>
        </div>
        <div class="print-doc-title-box">
          <h3 class="print-doc-title">${docType}</h3>
          <div class="print-doc-subtitle">Berdasarkan Standar ${proj.dataSource || 'SE Direktur Jenderal Bina Konstruksi No. 47/SE/Dk/2026'}</div>
        </div>
        <table class="print-header-project-table">
          <tbody>
            <tr>
              <td style="width: 16%;"><strong>Nama Pekerjaan:</strong></td>
              <td style="width: 38%; font-weight: 700; color: #0f172a;">${projName}</td>
              <td style="width: 18%;"><strong>Waktu Pelaksanaan:</strong></td>
              <td style="width: 28%; font-weight: 700; color: #1e40af;">${durDays} Hari Kalender (${durWeeks} Minggu)</td>
            </tr>
            <tr>
              <td><strong>Lokasi Proyek:</strong></td>
              <td>${projLoc}</td>
              <td><strong>Target Jadwal:</strong></td>
              <td>${startStr} s.d. ${finishStr}</td>
            </tr>
            <tr>
              <td><strong>Pemilik / Tugas:</strong></td>
              <td>${projOwner}</td>
              <td><strong>Kebutuhan Tenaga:</strong></td>
              <td style="font-weight: 700; color: #059669;">${laborInfoStr}</td>
            </tr>
            <tr>
              <td><strong>Konsultan:</strong></td>
              <td>${proj.consultant || "Tim Perencana & Manajemen Konstruksi"}</td>
              <td><strong>Wilayah Acuan:</strong></td>
              <td>${regionStr}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function createLandscapePrintHeader(arg1, arg2 = "KURVA S PEKERJAAN PROYEK", arg3 = {}) {
    let proj = {};
    let docType = "KURVA S PEKERJAAN PROYEK";
    let extraInfo = {};

    if (typeof arg1 === 'string') {
      docType = arg1;
      proj = arg2 || {};
      extraInfo = arg3 || {};
    } else {
      proj = arg1 || {};
      docType = (typeof arg2 === 'string') ? arg2 : "KURVA S PEKERJAAN PROYEK";
      extraInfo = (typeof arg3 === 'object') ? arg3 : {};
    }

    const projName = proj.name || proj.nama || "Pembangunan Rumah Tinggal Baru";
    const projLoc = proj.location || proj.lokasi || "Bandung, Jawa Barat";
    const projOwner = proj.owner || proj.pemilik || "Pemberi Tugas";
    const durDays = proj.durationDays || proj.durasi || 180;
    const durWeeks = Math.ceil(durDays / 7);
    const startStr = proj.startDate || proj.tanggalMulai || "2026-04-01";
    const finishStr = proj.finishDate || proj.tanggalSelesai || "2026-09-27";
    const contractorStr = proj.contractor || proj.kontraktor || "Dutamik.id";
    const docNumStr = proj.docNumber || proj.nomorDokumen || proj.kodeRegistrasi || "RAB/2026/001";
    const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const lDefaultLogoSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 302 342' width='302' height='342'><path d='M 23 163 L 23 150 L 150 21 L 278 150 L 278 163' fill='none' stroke='%23000000' stroke-width='13' stroke-linecap='round' stroke-linejoin='round'/><path d='M 44 155 L 44 317 L 110 317 L 110 220 A 40 40 0 0 1 190 220 L 190 317 L 256 317 L 256 155' fill='none' stroke='%23000000' stroke-width='13' stroke-linecap='round' stroke-linejoin='round'/></svg>";
    const lLogoSrc = (proj.logo && typeof proj.logo === 'string' && proj.logo.trim().length > 10) ? proj.logo : lDefaultLogoSvg;
    const lLogoSize = Math.max(40, Math.min(220, Number(proj.logoSize) || 60));
    const landLogoHtml = `
      <div class="print-header-landscape-logo" style="flex: 0 0 auto; margin-right: 10px; display: flex; align-items: center;">
        <img src="${lLogoSrc}" alt="Logo Proyek" style="width: ${lLogoSize}px !important; max-width: ${lLogoSize}px !important; max-height: ${Math.round(lLogoSize * 0.65)}px !important; object-fit: contain !important; display: block !important;">
      </div>
    `;

    return `
      <div class="print-header-landscape-compact" style="border-bottom: 1.5pt solid #0f172a; padding-bottom: 4px; margin-bottom: 6px; width: 100%; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <div style="width: 35%; display: flex; align-items: center; line-height: 1.2;">
            ${landLogoHtml}
            <div>
              <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">${contractorStr}</div>
              <div style="font-size: 7pt; color: #475569;">Estimasi Biaya &amp; Manajemen Konstruksi</div>
            </div>
          </div>
          <div style="width: 37%; text-align: center; line-height: 1.2;">
            <div style="font-size: 11pt; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${docType}</div>
            <div style="font-size: 7pt; color: #475569;">Standar ${proj.dataSource || 'SE Dirjen Bina Konstruksi No. 47/SE/Dk/2026'}</div>
          </div>
          <div style="width: 28%; text-align: right; font-size: 7.5pt; color: #334155; line-height: 1.25;">
            <div><strong>No. Dok:</strong> ${docNumStr}</div>
            <div><strong>Tgl Cetak:</strong> ${printDate}</div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; background: transparent; border: none; border-bottom: 1px solid #e2e8f0;">
          <tbody>
            <tr>
              <td style="padding: 2.5px 4px; width: 8%; font-weight: 700; color: #475569; white-space: nowrap;">Pekerjaan:</td>
              <td style="padding: 2.5px 4px; width: 30%; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${projName}">${projName}</td>
              <td style="padding: 2.5px 4px; width: 6%; font-weight: 700; color: #475569; white-space: nowrap;">Lokasi:</td>
              <td style="padding: 2.5px 4px; width: 24%; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${projLoc}">${projLoc}</td>
              <td style="padding: 2.5px 4px; width: 6%; font-weight: 700; color: #475569; white-space: nowrap;">Durasi:</td>
              <td style="padding: 2.5px 4px; width: 26%; font-weight: 700; color: #1e40af; white-space: nowrap; text-align: right;">${durDays} Hari (${durWeeks} Mgg) | ${startStr} s.d ${finishStr}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function createPrintFooter(arg1, options = {}) {
    const proj = (typeof arg1 === 'object' && arg1) ? arg1 : ((window.ProjectManager && window.ProjectManager.getActiveProject()) || {});
    const docNum = proj.docNumber || "RAB/2026/001";
    const contractor = proj.contractor || "";
    const pageStr = options.pageStr || "Halaman 1 dari 1";

    return `
      <div class="print-footer-block">
        <div class="footer-left">
          <span>${contractor ? contractor + '  :  ' : ''}${proj.dataSource || 'Standar SE PUPR No. 47/2026'}</span>
          <span style="margin-left: 8px; font-family: monospace;">(${docNum})</span>
        </div>
        <div class="footer-right">
          <strong>${pageStr}</strong>
        </div>
      </div>
    `;
  }

  function downloadPdfDirect(targetElementId, filename = "Dokumen_RAB.pdf", customOrientation = null) {
    // Alihkan langsung ke printDocument agar membuka browser print preview asli dengan kualitas vektor 100% utuh
    printDocument(targetElementId, filename);
  }

  return {
    printDocument,
    printViaHiddenIframe,
    downloadPdfDirect,
    createPrintHeader,
    createLandscapePrintHeader,
    createPrintFooter
  };
})();
