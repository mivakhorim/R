/**
 * Utility Format Mata Uang, Angka, dan Terbilang Bahasa Indonesia
 * Kepatuhan Negative Prompt:
 * - Anti-Pemisahan Rp dan Angka (white-space: nowrap & non-breaking space)
 * - Format Ribuan Titik (.) dan Desimal Koma (,)
 * - Maksimal 2 Desimal
 */

window.CurrencyUtil = (function() {
  function cleanNumber(val) {
    if (val === null || val === undefined || isNaN(val)) return 0;
    return Number(val);
  }

  // Format angka standar Indonesia: 1.250.000,50
  function formatNumber(val, decimals = 2) {
    const num = cleanNumber(val);
    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (decimals > 0 && parts[1]) {
      // Hapus trailing zero jika desimal kosong sempurna pada volume bulat
      return parts.join(',');
    }
    return parts[0];
  }

  // Format Rupiah tanpa pemisahan baris: Rp 1.500.000
  function formatRupiah(val, withDecimals = false, asHtml = false) {
    const num = cleanNumber(val);
    const formatted = formatNumber(num, withDecimals ? 2 : 0);
    const str = `Rp\u00A0${formatted}`; // Non-breaking space \u00A0
    if (asHtml) {
      return `<span class="rupiah-nowrap">${str}</span>`;
    }
    return str;
  }

  // Parse input string dari format Indonesia ke float murni
  function parseIndoNumber(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    // Hapus "Rp", spasi, dan ganti titik ribuan
    let cleaned = String(str).replace(/[^\d,-]/g, '');
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Konversi Angka ke Kata Terbilang Rupiah
  function terbilang(val) {
    const bilangan = [
      '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
      'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
    ];

    function convert(n) {
      n = Math.floor(Math.abs(n));
      if (n < 12) {
        return bilangan[n];
      } else if (n < 20) {
        return convert(n - 10) + ' Belas';
      } else if (n < 100) {
        return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
      } else if (n < 200) {
        return 'Seratus ' + convert(n - 100);
      } else if (n < 1000) {
        return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
      } else if (n < 2000) {
        return 'Seribu ' + convert(n - 1000);
      } else if (n < 1000000) {
        return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
      } else if (n < 1000000000) {
        return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
      } else if (n < 1000000000000) {
        return convert(Math.floor(n / 1000000000)) + ' Milyar ' + convert(n % 1000000000);
      } else if (n < 1000000000000000) {
        return convert(Math.floor(n / 1000000000000)) + ' Triliun ' + convert(n % 1000000000000);
      }
      return '';
    }

    const n = Math.round(cleanNumber(val));
    if (n === 0) return 'Nol Rupiah';
    const result = convert(n).replace(/\s+/g, ' ').trim();
    return `${result} Rupiah`;
  }

  return {
    formatNumber,
    formatRupiah,
    parseIndoNumber,
    terbilang
  };
})();
