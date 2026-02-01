// utils.js - Ferramentas, Segurança e Pix

// 1. Monitor de Rede
window.checkOnline = () => {
    if (!navigator.onLine) {
        if(window.mostrarToast) window.mostrarToast("Sem conexão com a internet!", "erro");
        return false;
    }
    return true;
};

// 2. Formatadores
window.formatMoney = (val) => parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// 3. Módulo Pix (Matemática Pura)
class PixPayload {
    constructor(k,n,c,v,i='ALFA'){this.k=k;this.n=this.cl(n,25);this.c=this.cl(c,15);this.v=v.toFixed(2);this.i=i;}
    cl(t,m){return t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").substring(0,m).toUpperCase();}
    pad(id,v){return id+v.toString().length.toString().padStart(2,'0')+v;}
    crc(s){let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++)c=(c&0x8000)?(c<<1)^0x1021:c<<1;}return(c&0xFFFF).toString(16).toUpperCase().padStart(4,'0');}
    gen(){let p=this.pad('00','01')+this.pad('26',this.pad('00','br.gov.bcb.pix')+this.pad('01',this.k))+this.pad('52','0000')+this.pad('53','986')+this.pad('54',this.v)+this.pad('58','BR')+this.pad('59',this.n)+this.pad('60',this.c)+this.pad('62',this.pad('05',this.i));return p+'6304'+this.crc(p+'6304');}
}
window.gerarPix = (v) => new PixPayload(CONFIG.pixKey, "ALFA SALGATERIA", "CURRAIS NOVOS", v).gen();

// 4. [NOVO] Timer de Pagamento Pix
let pixInterval;
window.iniciarTimerPix = (displayId, minutos) => {
    let timer = minutos * 60;
    const display = document.getElementById(displayId);
    
    // Limpa timer anterior se existir
    if (pixInterval) clearInterval(pixInterval);
    
    pixInterval = setInterval(() => {
        let m = parseInt(timer / 60, 10);
        let s = parseInt(timer % 60, 10);

        m = m < 10 ? "0" + m : m;
        s = s < 10 ? "0" + s : s;

        if (display) display.textContent = m + ":" + s;

        if (--timer < 0) {
            clearInterval(pixInterval);
            if(display) display.textContent = "EXPIRADO";
            if(window.mostrarToast) window.mostrarToast("Tempo para pagamento expirou!", "erro");
        }
    }, 1000);
};