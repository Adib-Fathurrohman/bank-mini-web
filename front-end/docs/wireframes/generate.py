"""Generates the low-fidelity wireframes (static HTML, flexbox only) for Figma import."""
import html
import os

E = html.escape
OUT = os.path.dirname(os.path.abspath(__file__))

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:#1f1f1f;background:#d9d9d9;padding:48px;display:flex;flex-direction:column;gap:64px;align-items:flex-start}
.doc{display:flex;flex-direction:column;gap:6px;width:1280px}
.doc h1{font-size:30px;font-weight:700}
.doc p{font-size:15px;color:#404040}
.block{display:flex;flex-direction:column;gap:12px}
.cap{display:flex;flex-direction:column;gap:2px;width:100%}
.cap .code{font-size:13px;font-weight:700;color:#595959;letter-spacing:0.04em}
.cap .name{font-size:20px;font-weight:700}
.cap .note{font-size:14px;color:#404040;max-width:720px}
.mrow{display:flex;gap:40px;align-items:flex-start}
.web{width:1280px;min-height:800px;background:#ffffff;border:1px solid #8c8c8c;display:flex}
.mobile{width:375px;height:812px;background:#ffffff;border:1px solid #8c8c8c;display:flex;flex-direction:column;overflow:hidden}
.side{width:224px;border-right:1px solid #bfbfbf;background:#f2f2f2;display:flex;flex-direction:column;padding:16px;gap:16px}
.logo{display:flex;gap:10px;align-items:center}
.mark{width:32px;height:32px;border:1px solid #595959;background:#bfbfbf;border-radius:4px}
.logo .t{display:flex;flex-direction:column}
.logo .t b{font-size:14px}
.logo .t span{font-size:12px;color:#595959}
.nav{display:flex;flex-direction:column;gap:2px}
.nav div{padding:8px 10px;border-radius:4px;color:#333333}
.nav .on{background:#cccccc;font-weight:700;color:#000000}
.spacer{flex:1}
.who{border-top:1px solid #bfbfbf;padding-top:12px;display:flex;flex-direction:column;gap:2px;font-size:13px}
.main{flex:1;display:flex;flex-direction:column;padding:24px 32px;gap:20px;min-width:0}
.head{display:flex;justify-content:space-between;align-items:center;gap:16px}
.head .l{display:flex;flex-direction:column;gap:4px}
.head .tl{display:flex;gap:10px;align-items:center}
.head h2{font-size:22px;font-weight:700}
.row{display:flex;gap:16px;align-items:flex-start}
.row.c{align-items:center}
.row.e{align-items:flex-end}
.row.sb{justify-content:space-between}
.col{display:flex;flex-direction:column;gap:12px}
.col.tight{gap:4px}
.grow{flex:1;min-width:0}
.box{border:1px solid #a6a6a6;border-radius:6px;padding:16px;display:flex;flex-direction:column;gap:12px;background:#ffffff}
.box h3{font-size:15px;font-weight:700}
.field{display:flex;flex-direction:column;gap:4px}
.lbl{font-size:13px;font-weight:600;color:#333333}
.input{height:38px;border:1px solid #8c8c8c;border-radius:4px;padding:0 10px;display:flex;align-items:center;justify-content:space-between;background:#ffffff;gap:8px}
.input.ph{color:#8c8c8c}
.input.area{height:84px;align-items:flex-start;padding-top:8px}
.input.big{height:60px;font-size:26px;font-weight:700}
.input.ro{background:#f2f2f2}
.hint{font-size:12px;color:#595959}
.err{font-size:12px;font-weight:700;border-left:3px solid #1f1f1f;padding-left:6px}
.btn{height:38px;padding:0 16px;border:1px solid #595959;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#ffffff;font-weight:600;white-space:nowrap}
.btn.pri{background:#333333;color:#ffffff;border-color:#333333}
.btn.sm{height:30px;padding:0 10px;font-size:13px}
.btn.lg{height:48px;font-size:15px}
.btn.off{color:#a6a6a6;border-color:#bfbfbf;background:#f2f2f2}
.btns{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btns.end{justify-content:flex-end}
.btns.st{flex-direction:column;align-items:stretch}
.badge{border:1px solid #737373;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600;background:#f2f2f2;white-space:nowrap}
.badge.dark{background:#333333;color:#ffffff;border-color:#333333}
.table{border:1px solid #a6a6a6;border-radius:6px;display:flex;flex-direction:column;overflow:hidden}
.tr{display:flex;border-top:1px solid #d9d9d9;align-items:center;min-height:40px}
.tr.first{border-top:none}
.tr.th{background:#ededed;font-weight:700;font-size:13px}
.tr.tot{background:#f5f5f5;font-weight:700}
.td{padding:8px 12px;min-width:0;display:flex;gap:6px;align-items:center}
.td.r{justify-content:flex-end;text-align:right}
.stats{display:flex;gap:12px}
.stat{border:1px solid #a6a6a6;border-radius:6px;padding:14px 16px;display:flex;flex-direction:column;gap:4px;flex:1}
.k{font-size:12px;color:#595959;text-transform:uppercase;letter-spacing:0.04em;font-weight:600}
.stat .v{font-size:22px;font-weight:700}
.dl{display:flex;flex-direction:column}
.it{display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #e0e0e0;gap:12px}
.it.first{border-top:none}
.it .dk{color:#595959}
.it .dv{font-weight:600;text-align:right}
.muted{color:#595959}
.small{font-size:12px}
.amt{font-size:34px;font-weight:700}
.amt.xl{font-size:40px}
.center{align-items:center;text-align:center}
.alert{border:1px dashed #595959;border-radius:6px;padding:10px 12px;background:#f5f5f5;font-size:13px;display:flex;flex-direction:column;gap:4px}
.overlay{flex:1;background:#a6a6a6;display:flex;align-items:center;justify-content:center;padding:40px}
.mobile .overlay{padding:0;align-items:flex-end}
.dialog{width:540px;background:#ffffff;border:1px solid #595959;border-radius:8px;padding:24px;display:flex;flex-direction:column;gap:16px}
.seg{display:flex;border:1px solid #595959;border-radius:4px;overflow:hidden;align-self:flex-start}
.seg div{padding:8px 20px;font-weight:600}
.seg .on{background:#333333;color:#ffffff}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{border:1px solid #8c8c8c;border-radius:16px;padding:4px 12px;font-size:13px;background:#ffffff}
.chip.on{background:#333333;color:#ffffff;border-color:#333333}
.steps{display:flex;flex-direction:column;gap:10px}
.step{display:flex;gap:10px;align-items:center}
.dot{width:24px;height:24px;border-radius:12px;border:1px solid #595959;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:#ffffff}
.dot.done{background:#333333;color:#ffffff}
.ring{width:120px;height:120px;border-radius:60px;border:8px solid #8c8c8c;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700}
.radio{display:flex;gap:10px;align-items:flex-start;border:1px solid #bfbfbf;border-radius:6px;padding:10px 12px}
.radio.on{border-color:#333333;background:#f5f5f5}
.rb{width:16px;height:16px;border-radius:8px;border:1px solid #595959;margin-top:2px;background:#ffffff}
.radio.on .rb{border:5px solid #333333}
.drop{border:2px dashed #8c8c8c;border-radius:8px;padding:28px;display:flex;flex-direction:column;align-items:center;gap:8px;background:#fafafa}
.fieldset{border:1px solid #bfbfbf;border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:10px}
.status{height:44px;padding:0 20px;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600}
.appbar{height:52px;padding:0 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #d9d9d9;font-weight:700;font-size:17px}
.back{width:24px;height:24px;border:1px solid #595959;border-radius:4px}
.mbody{flex:1;padding:16px;display:flex;flex-direction:column;gap:14px;overflow:hidden}
.tabbar{height:64px;border-top:1px solid #bfbfbf;display:flex;background:#ffffff}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:11px;color:#595959}
.tab.on{color:#000000;font-weight:700}
.ic{width:22px;height:22px;border:2px solid #8c8c8c;border-radius:5px}
.tab.on .ic{border-color:#000000;background:#d9d9d9}
.pins{display:flex;gap:14px;justify-content:center}
.pin{width:16px;height:16px;border-radius:8px;border:2px solid #333333}
.pin.f{background:#333333}
.keypad{display:flex;flex-direction:column;gap:10px;align-items:center}
.krow{display:flex;gap:14px}
.key{width:88px;height:56px;border:1px solid #a6a6a6;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;background:#fafafa}
.key.blank{border-color:#ffffff;background:#ffffff}
.list{display:flex;flex-direction:column;border:1px solid #bfbfbf;border-radius:6px;overflow:hidden}
.li{display:flex;justify-content:space-between;align-items:center;padding:12px;border-top:1px solid #e0e0e0;gap:10px}
.li.first{border-top:none}
.li .a{display:flex;flex-direction:column;gap:2px;min-width:0}
.sep{display:flex;align-items:center;gap:10px;color:#8c8c8c;font-size:12px}
.sep .ln{flex:1;height:1px;background:#bfbfbf}
.card{width:340px;height:214px;border:1px solid #595959;border-radius:10px;padding:16px;display:flex;gap:16px;align-items:center;background:#ffffff}
.gbtn{display:flex;gap:10px;align-items:center;justify-content:center}
.gl{width:18px;height:18px;border-radius:9px;border:1px solid #595959;background:#d9d9d9}
"""

# ---------------------------------------------------------------- helpers


def rp(n, sign=''):
    s = f'{abs(n):,}'.replace(',', '.')
    return f'{sign}Rp{s}'


def ph(w, h, label=''):
    """Image/QR placeholder: a box with a cross."""
    lab = f'<text x="{w/2}" y="{h/2+4}" text-anchor="middle" font-family="Arial" font-size="12" fill="#595959">{E(label)}</text>' if label else ''
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">'
            f'<rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" fill="#f2f2f2" stroke="#8c8c8c"/>'
            f'<line x1="0" y1="0" x2="{w}" y2="{h}" stroke="#bfbfbf"/><line x1="{w}" y1="0" x2="0" y2="{h}" stroke="#bfbfbf"/>'
            f'{lab}</svg>')


def btn(text, kind=''):
    return f'<div class="btn {kind}">{E(text)}</div>'


def btns(*items, cls=''):
    return f'<div class="btns {cls}">{"".join(items)}</div>'


def badge(text, dark=False):
    return f'<span class="badge{" dark" if dark else ""}">{E(text)}</span>'


def field(label, value='', placeholder='', hint='', error='', kind='', width=None, suffix=''):
    style = f' style="width:{width}px"' if width else ''
    content = E(value) if value else E(placeholder)
    cls = 'input ' + kind + ('' if value else ' ph')
    suf = f'<span class="muted">{E(suffix)}</span>' if suffix else ''
    lab = f'<div class="lbl">{E(label)}</div>' if label else ''
    extra = (f'<div class="err">{E(error)}</div>' if error else '') + (f'<div class="hint">{E(hint)}</div>' if hint else '')
    return f'<div class="field"{style}>{lab}<div class="{cls}"><span>{content}</span>{suf}</div>{extra}</div>'


def select(label, value, width=None):
    return field(label, value, width=width, suffix='▾')


def head(title, sub='', actions='', meta=''):
    s = f'<div class="muted">{E(sub)}</div>' if sub else ''
    return (f'<div class="head"><div class="l"><div class="tl"><h2>{E(title)}</h2>{meta}</div>{s}</div>'
            f'{actions}</div>')


def table(cols, rows, total=None):
    """cols: list of (label, width or None, align)."""
    def cell(i, v):
        label, w, align = cols[i]
        style = f'width:{w}px;flex:none' if w else 'flex:1'
        return f'<div class="td{" r" if align == "r" else ""}" style="{style}">{v}</div>'
    out = ['<div class="table">', '<div class="tr th first">' + ''.join(cell(i, E(c[0])) for i, c in enumerate(cols)) + '</div>']
    for r in rows:
        out.append('<div class="tr">' + ''.join(cell(i, v) for i, v in enumerate(r)) + '</div>')
    if total:
        out.append('<div class="tr tot">' + ''.join(cell(i, v) for i, v in enumerate(total)) + '</div>')
    out.append('</div>')
    return ''.join(out)


def dl(pairs):
    items = []
    for i, (k, v) in enumerate(pairs):
        items.append(f'<div class="it{" first" if i == 0 else ""}"><span class="dk">{E(k)}</span><span class="dv">{v}</span></div>')
    return f'<div class="dl">{"".join(items)}</div>'


def box(content, title='', cls='', style=''):
    t = f'<h3>{E(title)}</h3>' if title else ''
    st = f' style="{style}"' if style else ''
    return f'<div class="box {cls}"{st}>{t}{content}</div>'


def stats(pairs):
    return '<div class="stats">' + ''.join(f'<div class="stat"><span class="k">{E(k)}</span><span class="v">{E(v)}</span></div>' for k, v in pairs) + '</div>'


def alert(title, text=''):
    t = f'<span>{E(text)}</span>' if text else ''
    return f'<div class="alert"><b>{E(title)}</b>{t}</div>'


def radio(title, desc='', on=False):
    d = f'<span class="muted small">{E(desc)}</span>' if desc else ''
    return f'<div class="radio{" on" if on else ""}"><div class="rb"></div><div class="col tight"><b>{E(title)}</b>{d}</div></div>'


def row(*items, cls=''):
    return f'<div class="row {cls}">{"".join(items)}</div>'


def col(*items, cls='', style=''):
    st = f' style="{style}"' if style else ''
    return f'<div class="col {cls}"{st}>{"".join(items)}</div>'


def caption(code, name, note):
    return (f'<div class="cap"><span class="code">{E(code)}</span><span class="name">{E(name)}</span>'
            f'<span class="note">{E(note)}</span></div>')


# ---------------------------------------------------------------- frames

NAV = {
    'teller': ['Shift', 'Layanan nasabah', 'Transaksi & koreksi', 'Tutup shift', 'Riwayat shift'],
    'supervisor': ['Dasbor', 'Laporan harian', 'Brankas', 'Nasabah', 'Staf', 'Log audit', 'Jurnal', 'Laporan'],
    'admin': ['Dasbor', 'Staf', 'Nasabah', 'Pengaturan', 'Log audit', 'Jurnal', 'Laporan'],
}
WHO = {
    'teller': ('Siti Rahma', 'Teller · XI AKL 1'),
    'supervisor': ('Pak Hendra', 'Supervisor'),
    'admin': ('Admin Sekolah', 'Administrator'),
}


def sidebar(role, active):
    nav = ''.join(f'<div class="{"on" if n == active else ""}">{E(n)}</div>' for n in NAV[role])
    shift = ''
    if role == 'teller':
        shift = box(f'{row(badge("Berjalan"))}<div class="col tight"><span class="k">Kas di laci (sistem)</span>'
                    f'<b style="font-size:18px">{rp(1_840_000)}</b><span class="muted small">Shift 2 Nov 2026 · 12 transaksi</span></div>',
                    style='padding:12px;gap:8px')
    name, sub = WHO[role]
    return (f'<div class="side"><div class="logo"><div class="mark"></div><div class="t"><b>E-Teller</b><span>Bank Mini Sekolah</span></div></div>'
            f'{shift}<div class="nav">{nav}</div><div class="spacer"></div>'
            f'<div class="who"><b>{E(name)}</b><span class="muted">{E(sub)}</span>{btn("Keluar", "sm")}</div></div>')


def web(code, name, note, role, active, body):
    return (f'<div class="block">{caption(code, name, note)}'
            f'<div class="web">{sidebar(role, active)}<div class="main">{body}</div></div></div>')


def web_dialog(code, name, note, body):
    return (f'<div class="block">{caption(code, name, note)}'
            f'<div class="web"><div class="overlay"><div class="dialog">{body}</div></div></div></div>')


def web_plain(code, name, note, body):
    return (f'<div class="block">{caption(code, name, note)}'
            f'<div class="web" style="background:#f2f2f2;align-items:center;justify-content:center">{body}</div></div>')


TABS = ['Beranda', 'Riwayat', 'Kartu', 'Profil']


def mobile(code, name, note, body, title='', back=False, tab=None):
    bar = ''
    if title:
        bar = f'<div class="appbar">{"<div class=back></div>" if back else ""}<span>{E(title)}</span></div>'
    tabs = ''
    if tab:
        tabs = '<div class="tabbar">' + ''.join(
            f'<div class="tab{" on" if t == tab else ""}"><div class="ic"></div><span>{t}</span></div>' for t in TABS) + '</div>'
    return (f'<div class="block" style="width:375px">{caption(code, name, note)}'
            f'<div class="mobile"><div class="status"><span>09:41</span><span>●●● ▮</span></div>{bar}'
            f'<div class="mbody">{body}</div>{tabs}</div></div>')


def mrow(*frames):
    return f'<div class="mrow">{"".join(frames)}</div>'


def page(title, intro, frames, fname):
    doc = (f'<!doctype html><html lang="id"><head><meta charset="utf-8">'
           f'<meta name="viewport" content="width=device-width, initial-scale=1">'
           f'<title>{E(title)}</title><style>{CSS}</style></head><body>'
           f'<div class="doc"><h1>{E(title)}</h1><p>{E(intro)}</p></div>{"".join(frames)}</body></html>')
    with open(os.path.join(OUT, fname), 'w') as f:
        f.write(doc)
    return fname


# ---------------------------------------------------------------- shared data

DENOMS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100]


def count_table(counts):
    rows = []
    total = 0
    for d, c in zip(DENOMS, counts):
        total += d * c
        unit = 'lembar' if d >= 1000 else 'keping'
        rows.append([rp(d), f'<div class="input" style="width:110px;height:32px"><span>{c}</span></div><span class="muted small">{unit}</span>', rp(d * c)])
    return table([('Pecahan', 140, 'l'), ('Jumlah', None, 'l'), ('Subtotal', 160, 'r')], rows,
                 total=['Total', f'{sum(counts)} lembar/keping', rp(total)]), total


def staff_login(code):
    form = box(col(
        '<div class="logo"><div class="mark"></div><div class="t"><b>E-Teller</b><span>Bank Mini Sekolah · Staf</span></div></div>',
        '<h2 style="font-size:22px">Masuk</h2>',
        field('Username', 'siti.teller'),
        field('Kata sandi', '••••••••'),
        btn('Masuk', 'pri lg'),
        '<span class="hint">Nasabah masuk lewat aplikasi E-Teller di HP.</span>',
    ), style='width:400px;padding:28px')
    return web_plain(code, 'Masuk staf', 'Satu halaman login untuk teller, supervisor, dan admin. Setelah masuk, menu mengikuti peran.', form)


CUST_PANEL = box(col(
    row(col('<b style="font-size:17px">Budi Santoso</b><span class="muted">RPL-2026-001 · NIS 20260001</span>', cls='tight grow'), badge('Aktif'), cls='c'),
    col('<span class="k">Saldo</span>', f'<span class="amt">{rp(1_250_000)}</span>',
        f'<span class="muted small">Dapat ditarik {rp(1_240_000)} · saldo minimum {rp(10_000)}</span>', cls='tight'),
    dl([('Kelas', 'X RPL 1'), ('Jurusan', 'Rekayasa Perangkat Lunak')]),
), title='')


def lookup(disabled=False):
    k = 'off' if disabled else ''
    return box(col(
        field('', placeholder='NIS / nomor rekening / scan QR'),
        btns(btn('Cari', k), btn('Scan QR', k), btn('Nasabah berikutnya', 'sm ' + k)),
        '<span class="hint">Tekan / untuk langsung mengetik.</span>' if not disabled else '<span class="hint">Pencarian dikunci selama permintaan penarikan berjalan.</span>',
    ), title='Cari nasabah')


def counter_layout(work, disabled=False):
    return row(col(lookup(disabled), CUST_PANEL, style='width:400px'), col(work, cls='grow'))


TX_ROWS = [
    ['#131', '10:42', 'Tarik tunai', 'Budi Santoso', rp(100_000, '−')],
    ['#130', '10:15', 'Setor tunai', 'Citra Lestari', rp(250_000, '+')],
    ['#129', '09:58', 'Setor tunai', 'Andi Pratama', rp(50_000, '+')],
    ['#128', '09:31', 'Tarik tunai', 'Citra Lestari', rp(20_000, '−')],
    ['#127', '09:12', 'Setor tunai', 'Budi Santoso', rp(100_000, '+')],
]


# ================================================================= TELLER

def teller():
    f = [staff_login('S-01')]

    counts_open = [5, 4, 5, 10, 10, 10, 10, 20, 0, 0]
    t, total = count_table(counts_open)
    f.append(web('T-01', 'Buka shift', 'Teller menghitung uang di laci per pecahan sebelum melayani nasabah. Total menjadi saldo awal shift.', 'teller', 'Shift',
                 head('Buka shift', 'Hitung uang di laci per pecahan.') +
                 row(box(t, 'Hitungan kas awal', cls='grow'),
                     box(col('<span class="k">Saldo awal</span>', f'<span class="amt">{rp(total)}</span>',
                             '<span class="muted small">satu juta seratus sepuluh ribu rupiah</span>',
                             dl([('Tanggal', '2 Nov 2026'), ('Teller', 'Siti Rahma'), ('Lembar/keping', str(sum(counts_open)))]),
                             btn('Buka shift', 'pri lg')), style='width:320px'))))

    f.append(web('T-02', 'Beranda shift', 'Ringkasan shift yang berjalan: saldo awal + setoran − penarikan = kas di laci. Pintu masuk ke layanan nasabah dan tutup shift.', 'teller', 'Shift',
                 head('Shift 2 Nov 2026', 'Dibuka 07:05 WIB', btns(btn('Tutup shift'), btn('Layani nasabah', 'pri')), badge('Berjalan')) +
                 stats([('Saldo awal', rp(1_110_000)), ('Setoran', rp(1_030_000, '+')), ('Penarikan', rp(300_000, '−')), ('Kas di laci (sistem)', rp(1_840_000))]) +
                 box(table([('No.', 80, 'l'), ('Waktu', 90, 'l'), ('Jenis', 160, 'l'), ('Nasabah', None, 'l'), ('Jumlah', 160, 'r')], TX_ROWS),
                     'Transaksi shift ini')))

    deposit = box(col(
        '<div class="seg"><div class="on">Setor</div><div>Tarik</div></div>',
        field('Jumlah setoran', '50.000', kind='big', hint='Bilangan bulat, kelipatan Rp100, maksimal Rp100.000.000.'),
        '<div class="chips"><span class="chip">10.000</span><span class="chip">20.000</span><span class="chip">50.000</span><span class="chip">100.000</span></div>',
        dl([('Saldo sekarang', rp(1_250_000)), ('Saldo sesudah', rp(1_300_000))]),
        btn('Lanjutkan', 'pri lg'),
    ), 'Transaksi')
    f.append(web('T-03', 'Layanan nasabah — setor', 'Cari nasabah (ketik NIS/rekening atau scan QR kartu), lihat data dan saldonya, lalu isi jumlah setoran.', 'teller', 'Layanan nasabah',
                 head('Layanan nasabah') + counter_layout(deposit)))

    f.append(web_dialog('T-04', 'Konfirmasi setoran', 'Ringkasan sebelum disimpan. Enter = setor. Setelah berhasil tampil struk (T-08).',
                        '<h2 style="font-size:20px">Konfirmasi setoran</h2>' +
                        col('<span class="k">Setor tunai</span>', f'<span class="amt xl">{rp(50_000)}</span>', '<span class="muted">lima puluh ribu rupiah</span>', cls='tight center') +
                        dl([('Nasabah', 'Budi Santoso'), ('Rekening', 'RPL-2026-001'), ('Saldo sesudah', rp(1_300_000))]) +
                        btns(btn('Ubah'), btn('Setor Rp50.000', 'pri'), cls='end')))

    withdraw = box(col(
        '<div class="seg"><div>Setor</div><div class="on">Tarik</div></div>',
        field('Jumlah penarikan', '100.000', kind='big'),
        dl([('Saldo sekarang', rp(1_250_000)), ('Saldo sesudah', rp(1_150_000)), ('Saldo minimum', rp(10_000))]),
        alert('PIN dimasukkan nasabah di HP-nya sendiri', 'Teller mengirim permintaan ke aplikasi nasabah. Teller tidak pernah melihat atau mengetik PIN.'),
        btn('Lanjutkan', 'pri lg'),
    ), 'Transaksi')
    f.append(web('T-05', 'Layanan nasabah — tarik', 'Sistem mengecek saldo dulu (saldo sesudah tidak boleh di bawah saldo minimum). Lanjutkan → konfirmasi → kirim ke aplikasi nasabah.', 'teller', 'Layanan nasabah',
                 head('Layanan nasabah') + counter_layout(withdraw)))

    def steps(state):
        labels = ['Dikirim ke aplikasi nasabah', 'Persetujuan nasabah', 'Penarikan dicatat']
        out = []
        for i, l in enumerate(labels):
            done = i < state
            cur = i == state
            out.append(f'<div class="step"><div class="dot{" done" if done else ""}">{"✓" if done else i + 1}</div><span{" style=font-weight:700" if cur else ""}>{E(l)}</span></div>')
        return f'<div class="steps">{"".join(out)}</div>'

    waiting = box(col(
        row(col('<span class="k">Tarik tunai · persetujuan nasabah</span>', f'<span class="amt">{rp(100_000)}</span>', '<span class="muted small">seratus ribu rupiah</span>', cls='tight grow'), badge('Menunggu persetujuan nasabah'), cls='c'),
        row(steps(1), '<div class="spacer"></div>', col('<div class="ring">01:42</div>', '<span class="muted small">sisa waktu nasabah</span>', cls='center tight'), cls='c'),
        alert('Minta nasabah membuka aplikasi E-Teller', 'Nasabah menyetujui dengan PIN di HP-nya. Layar ini diperbarui otomatis setiap 2 detik.'),
        btns(btn('Batalkan permintaan')),
    ))
    f.append(web('T-06', 'Tarik — menunggu persetujuan nasabah', 'Permintaan terkirim ke aplikasi nasabah. Nasabah punya 2 menit. Status lain: ditolak, kedaluwarsa, dibatalkan → tombol "Buat permintaan baru".', 'teller', 'Layanan nasabah',
                 head('Layanan nasabah') + counter_layout(waiting, disabled=True)))

    approved = box(col(
        row(col('<span class="k">Tarik tunai · persetujuan nasabah</span>', f'<span class="amt">{rp(100_000)}</span>', cls='tight grow'), badge('Disetujui nasabah', True), cls='c'),
        row(steps(2), '<div class="spacer"></div>', col('<div class="ring">01:55</div>', '<span class="muted small">selesaikan sebelum habis</span>', cls='center tight'), cls='c'),
        alert('Nasabah sudah menyetujui pukul 10:41', 'Selesaikan penarikan, lalu serahkan uang tunai.'),
        btns(btn('Batalkan'), btn('Selesaikan penarikan', 'pri lg')),
    ))
    f.append(web('T-07', 'Tarik — disetujui nasabah', 'Setelah nasabah menyetujui, teller punya 2 menit untuk menyelesaikan. Enter = selesaikan.', 'teller', 'Layanan nasabah',
                 head('Layanan nasabah') + counter_layout(approved, disabled=True)))

    receipt = box(col(
        row(col('<b style="font-size:17px">Penarikan tercatat</b><span class="muted small">2 Nov 2026 10:42 WIB</span>', cls='tight grow'), btn('Cetak struk'), cls='c'),
        col(f'<span class="amt xl">{rp(100_000, "−")}</span>', '<span class="muted">seratus ribu rupiah</span>', cls='tight center'),
        dl([('No. transaksi', '#131'), ('Nasabah', 'Budi Santoso'), ('Rekening', 'RPL-2026-001'), ('Saldo sebelum', rp(1_250_000)),
            ('Saldo sesudah', rp(1_150_000)), ('Persetujuan', 'Aplikasi nasabah · 10:41')]),
        alert('Serahkan uang tunai Rp100.000 ke nasabah.'),
        btns(btn('Transaksi lain'), btn('Nasabah berikutnya', 'pri'), cls='end'),
    ))
    f.append(web('T-08', 'Struk transaksi', 'Hasil setor atau tarik: nomor transaksi, saldo sebelum/sesudah, cetak struk PDF.', 'teller', 'Layanan nasabah',
                 head('Layanan nasabah') + counter_layout(receipt)))

    act = btns(btn('Cetak', 'sm'), btn('Koreksi', 'sm'))
    rows = [
        ['#131', '10:42', 'Tarik tunai', 'Budi Santoso', rp(100_000, '−'), '', act],
        ['#130', '10:15', 'Setor tunai', 'Citra Lestari', rp(250_000, '+'), '', act],
        ['#129', '09:58', 'Koreksi setor', 'Andi Pratama', rp(500_000, '−'), '<span class="small">Membatalkan #126</span>', btns(btn('Cetak', 'sm'))],
        ['#126', '09:40', 'Setor tunai', 'Andi Pratama', f'<s>{rp(500_000, "+")}</s>', badge('Dikoreksi'), btns(btn('Cetak', 'sm'))],
        ['#125', '09:12', 'Setor tunai', 'Budi Santoso', rp(100_000, '+'), '', act],
    ]
    f.append(web('T-09', 'Transaksi & koreksi', 'Transaksi teller per tanggal. Cetak ulang struk, atau koreksi transaksi yang salah ketik (hanya shift yang berjalan).', 'teller', 'Transaksi & koreksi',
                 head('Transaksi & koreksi', '', row(field('', '02/11/2026', width=160, suffix='▾'), btn('Hari ini'), cls='c')) +
                 box(table([('No.', 70, 'l'), ('Waktu', 80, 'l'), ('Jenis', 140, 'l'), ('Nasabah', None, 'l'), ('Jumlah', 140, 'r'), ('Keterangan', 170, 'l'), ('Aksi', 170, 'l')], rows),
                     'Senin, 2 November 2026 · 5 transaksi')))

    f.append(web_dialog('T-10', 'Koreksi transaksi', 'Koreksi membuat transaksi pembalik (transaksi asli tidak dihapus). Wajib alasan dan otorisasi supervisor.',
                        '<h2 style="font-size:20px">Koreksi transaksi #130</h2>' +
                        dl([('Jenis', 'Setor tunai'), ('Nasabah', 'Citra Lestari'), ('Jumlah', rp(250_000, '+')), ('Waktu', '10:15')]) +
                        field('Alasan koreksi', 'Salah ketik jumlah, seharusnya Rp25.000', kind='area', hint='Maksimal 255 karakter.') +
                        '<div class="fieldset"><b>Otorisasi supervisor</b>' + row(col(field('Username supervisor', 'hendra.spv'), cls='grow'), col(field('Kata sandi', '••••••••'), cls='grow')) + '</div>' +
                        btns(btn('Batal'), btn('Batalkan transaksi #130', 'pri'), cls='end')))

    t2, total2 = count_table([8, 6, 5, 10, 10, 10, 10, 20, 0, 0])
    f.append(web('T-11', 'Tutup shift', 'Teller menghitung uang fisik. Uang fisik harus sama persis dengan kas sistem. Setelah ditutup, laporan harian dikirim ke supervisor.', 'teller', 'Tutup shift',
                 head('Tutup shift', 'Shift 2 Nov 2026') +
                 stats([('Saldo awal', rp(1_110_000)), ('Setoran', rp(1_030_000, '+')), ('Penarikan', rp(300_000, '−')), ('Kas di laci (sistem)', rp(1_840_000))]) +
                 row(box(t2, 'Hitungan uang fisik', cls='grow'),
                     box(col(dl([('Kas sistem', rp(1_840_000)), ('Uang fisik', rp(total2)), ('Selisih', rp(total2 - 1_840_000))]),
                             alert('Cocok', 'Uang fisik sama dengan kas sistem.') if total2 == 1_840_000 else alert('Belum cocok', f'Selisih {rp(total2 - 1_840_000)}. Hitung ulang sebelum menutup shift.'),
                             btn('Tutup shift', 'pri lg')), 'Rekonsiliasi', style='width:320px'))))

    hist = [
        ['2 Nov 2026', badge('Menunggu verifikasi'), rp(1_030_000, '+'), rp(300_000, '−'), rp(1_840_000), rp(1_840_000), btn('Detail', 'sm')],
        ['1 Nov 2026', badge('Disetujui', True), rp(850_000, '+'), rp(120_000, '−'), rp(1_840_000), rp(1_840_000), btn('Detail', 'sm')],
        ['31 Okt 2026', badge('Ditahan'), rp(400_000, '+'), rp(0), rp(1_510_000), rp(1_510_000), btn('Detail', 'sm')],
        ['30 Okt 2026', badge('Ditolak'), rp(600_000, '+'), rp(50_000, '−'), rp(1_660_000), '—', btn('Detail', 'sm')],
    ]
    f.append(web('T-12', 'Riwayat shift', 'Daftar laporan harian milik teller dan status verifikasi supervisor.', 'teller', 'Riwayat shift',
                 head('Riwayat shift', 'Laporan harian Anda dan status verifikasinya.') +
                 box(table([('Tanggal', 130, 'l'), ('Status', 190, 'l'), ('Setoran', None, 'r'), ('Penarikan', None, 'r'), ('Kas sistem', None, 'r'), ('Uang fisik', None, 'r'), ('', 100, 'r')], hist)) +
                 btns(btn('Sebelumnya', 'sm off'), '<span class="muted small">1–4 dari 4</span>', btn('Berikutnya', 'sm off'))))

    f.append(web('T-13', 'Detail shift / laporan harian', 'Isi laporan harian: ringkasan, hitungan kas awal dan akhir, transaksi. Tombol cetak laporan harian (PDF).', 'teller', 'Riwayat shift',
                 head('Laporan harian 2 Nov 2026', 'Ditutup 14:30 WIB', btn('Cetak laporan harian', 'pri'), badge('Menunggu verifikasi')) +
                 stats([('Saldo awal', rp(1_110_000)), ('Setoran', rp(1_030_000, '+')), ('Penarikan', rp(300_000, '−')), ('Kas sistem', rp(1_840_000)), ('Selisih', rp(0))]) +
                 row(box(table([('Pecahan', None, 'l'), ('Awal', 90, 'r'), ('Akhir', 90, 'r')],
                               [[rp(d), str(a), str(b)] for d, a, b in zip(DENOMS[:6], counts_open, [8, 6, 5, 10, 10, 10])]), 'Hitungan kas', style='width:380px'),
                     box(table([('No.', 70, 'l'), ('Waktu', 80, 'l'), ('Jenis', 130, 'l'), ('Nasabah', None, 'l'), ('Jumlah', 130, 'r')], TX_ROWS[:4]), 'Transaksi', cls='grow'))))

    return page('Wireframe — Teller', 'Web staf (1280 × 800). Teller melayani setor dan tarik tunai di loket, dengan satu layar. Persetujuan penarikan dilakukan nasabah di aplikasi HP.', f, 'teller.html')


# ================================================================= SHARED AUDIT PAGES

def audit_pages(role, prefix, start):
    n = start
    f = []
    rows = [
        ['2 Nov 10:42', '#131', 'Tarik tunai', 'Siti Rahma', 'Budi Santoso', rp(100_000, '−'), btn('Detail', 'sm')],
        ['2 Nov 10:15', '#130', 'Setor tunai', 'Siti Rahma', 'Citra Lestari', rp(250_000, '+'), btn('Detail', 'sm')],
        ['2 Nov 09:58', '#129', 'Koreksi setor', 'Siti Rahma', 'Andi Pratama', rp(500_000, '−'), btn('Detail', 'sm')],
        ['2 Nov 08:30', '#124', 'Setor tunai', 'Rudi Hartono', 'Dewi Anggraini', rp(75_000, '+'), btn('Detail', 'sm')],
    ]
    f.append(web(f'{prefix}-{n:02d}', 'Log audit transaksi', 'Semua transaksi dengan filter tanggal/jam, teller, nasabah, dan jenis. Detail menampilkan jurnal dan persetujuan nasabah via aplikasi. Ekspor PDF.', role, 'Log audit',
                 head('Log audit', '', btn('Ekspor PDF')) +
                 box(row(field('Dari', '01/11/2026 00:00', width=180), field('Sampai', '02/11/2026 23:59', width=180), select('Teller', 'Semua teller', 170),
                         field('Nasabah', placeholder='Nama / NIS', width=170), select('Jenis', 'Semua jenis', 150), btn('Terapkan', 'pri'), cls='e')) +
                 box(table([('Waktu', 120, 'l'), ('No.', 70, 'l'), ('Jenis', 130, 'l'), ('Teller', None, 'l'), ('Nasabah', None, 'l'), ('Jumlah', 130, 'r'), ('', 90, 'r')], rows))))
    n += 1
    f.append(web(f'{prefix}-{n:02d}', 'Jurnal & neraca saldo', 'Jurnal entri ganda (debit/kredit) dan neraca saldo yang harus seimbang. Ekspor PDF.', role, 'Jurnal',
                 head('Jurnal & neraca saldo', '', btn('Ekspor PDF')) +
                 box(row(field('Dari', '02/11/2026', width=160), field('Sampai', '02/11/2026', width=160), select('Akun', 'Semua akun', 200), select('Posisi', 'Debit & kredit', 160), btn('Terapkan', 'pri'), cls='e')) +
                 row(box(col(row('<b>Neraca saldo</b>', badge('Seimbang', True), cls='c sb'),
                             table([('Akun', None, 'l'), ('Debit', 120, 'r'), ('Kredit', 120, 'r')],
                                   [['101 Kas', rp(1_030_000), rp(300_000)], ['102 Brankas', rp(0), rp(0)], ['201 Tabungan nasabah', rp(300_000), rp(1_030_000)]],
                                   total=['Total', rp(1_330_000), rp(1_330_000)])), style='width:440px'),
                     box(table([('Waktu', 110, 'l'), ('Transaksi', 90, 'l'), ('Akun', None, 'l'), ('Debit', 110, 'r'), ('Kredit', 110, 'r')],
                               [['10:42', '#131', '201 Tabungan nasabah', rp(100_000), ''], ['10:42', '#131', '101 Kas', '', rp(100_000)],
                                ['10:15', '#130', '101 Kas', rp(250_000), ''], ['10:15', '#130', '201 Tabungan nasabah', '', rp(250_000)]]), 'Jurnal', cls='grow'))))
    n += 1
    f.append(web(f'{prefix}-{n:02d}', 'Laporan', 'Unduh laporan PDF: laporan tahunan per tahun ajaran, log audit, dan jurnal.', role, 'Laporan',
                 head('Laporan') +
                 row(box(col('<span class="muted">Rekap setoran, penarikan, dan saldo per bulan dalam satu tahun ajaran.</span>',
                             select('Tahun ajaran', '2026/2027', 260), btn('Unduh PDF', 'pri')), 'Laporan tahunan', cls='grow'),
                     box(col('<span class="muted">Transaksi dalam rentang tanggal.</span>', row(field('Dari', '01/11/2026'), field('Sampai', '30/11/2026')), btn('Unduh PDF')), 'Log audit', cls='grow'),
                     box(col('<span class="muted">Jurnal entri ganda dalam rentang tanggal.</span>', row(field('Dari', '01/11/2026'), field('Sampai', '30/11/2026')), btn('Unduh PDF')), 'Jurnal', cls='grow'))))
    return f


CUSTOMER_ROWS = [
    ['20260001', 'Budi Santoso', 'RPL-2026-001', 'X RPL 1', badge('Aktif'), badge('Teraktivasi', True), rp(1_150_000)],
    ['20260002', 'Andi Pratama', 'DKV-2026-001', 'XI DKV 1', badge('Aktif'), badge('Menunggu'), rp(320_000)],
    ['20260003', 'Citra Lestari', 'RPL-2026-002', 'XII RPL 2', badge('Dibekukan'), badge('Teraktivasi', True), rp(75_000)],
    ['20260004', 'Dewi Anggraini', 'AKL-2026-001', 'X AKL 1', badge('Aktif'), badge('Menunggu'), rp(0)],
]
STAFF_ROWS = [
    ['siti.teller', 'Siti Rahma', 'Teller', 'XI AKL 1', '0812-3456-7890', badge('Aktif')],
    ['rudi.teller', 'Rudi Hartono', 'Teller', 'XI AKL 2', '0813-2222-1111', badge('Aktif')],
    ['hendra.spv', 'Pak Hendra', 'Supervisor', '—', '0811-0000-1234', badge('Aktif')],
    ['lina.teller', 'Lina Marlina', 'Teller', 'XII AKL 1', '0819-8888-7777', badge('Diblokir')],
]


# ================================================================= SUPERVISOR

def supervisor():
    f = [staff_login('S-01')]
    pend = [
        ['2 Nov 2026', 'Siti Rahma', rp(1_840_000), rp(1_840_000), rp(0), btn('Tinjau', 'sm pri')],
        ['2 Nov 2026', 'Rudi Hartono', rp(960_000), rp(960_000), rp(0), btn('Tinjau', 'sm pri')],
        ['1 Nov 2026', 'Lina Marlina', rp(1_200_000), rp(1_200_000), rp(0), btn('Tinjau', 'sm pri')],
    ]
    f.append(web('V-01', 'Dasbor supervisor', 'Ringkasan pekerjaan: laporan yang menunggu, ditahan, shift yang masih berjalan, kas masuk brankas hari ini, status neraca.', 'supervisor', 'Dasbor',
                 head('Dasbor', 'Senin, 2 November 2026') +
                 stats([('Laporan menunggu', '3'), ('Laporan ditahan', '1'), ('Shift berjalan', '2'), ('Masuk brankas hari ini', rp(2_450_000))]) +
                 box(table([('Tanggal', 120, 'l'), ('Teller', None, 'l'), ('Kas sistem', 130, 'r'), ('Uang fisik', 130, 'r'), ('Selisih', 90, 'r'), ('', 100, 'r')], pend), 'Perlu ditinjau') +
                 box(row(col(row('<b>Neraca saldo hari ini</b>', badge('Seimbang', True), cls='c'), cls='grow'), dl([('Total debit', rp(1_330_000)), ('Total kredit', rp(1_330_000))]).replace('class="dl"', 'class="dl" style="width:320px"'), btn('Lihat jurnal'), cls='c'))))

    rows = [
        ['2 Nov 2026', 'Siti Rahma', badge('Menunggu verifikasi'), rp(1_030_000, '+'), rp(300_000, '−'), rp(1_840_000), rp(0), btn('Tinjau', 'sm pri')],
        ['2 Nov 2026', 'Rudi Hartono', badge('Berjalan'), rp(400_000, '+'), rp(40_000, '−'), rp(960_000), '—', btn('Lihat', 'sm')],
        ['1 Nov 2026', 'Siti Rahma', badge('Disetujui', True), rp(850_000, '+'), rp(120_000, '−'), rp(1_840_000), rp(0), btn('Lihat', 'sm')],
        ['31 Okt 2026', 'Lina Marlina', badge('Ditahan'), rp(400_000, '+'), rp(0), rp(1_510_000), rp(0), btn('Tinjau', 'sm pri')],
    ]
    f.append(web('V-02', 'Daftar laporan harian', 'Semua laporan harian teller dengan filter status, tanggal, dan teller. Shift yang berjalan tampil dengan total sementara.', 'supervisor', 'Laporan harian',
                 head('Laporan harian') +
                 box(row(select('Status', 'Menunggu verifikasi', 220), field('Tanggal', '02/11/2026', width=170), select('Teller', 'Semua teller', 200), btn('Terapkan', 'pri'), cls='e')) +
                 box(table([('Tanggal', 120, 'l'), ('Teller', None, 'l'), ('Status', 180, 'l'), ('Setoran', 120, 'r'), ('Penarikan', 120, 'r'), ('Kas sistem', 120, 'r'), ('Selisih', 80, 'r'), ('', 90, 'r')], rows))))

    counts = table([('Pecahan', None, 'l'), ('Awal', 70, 'r'), ('Akhir', 70, 'r')],
                   [[rp(d), str(a), str(b)] for d, a, b in zip(DENOMS[:7], [5, 4, 5, 10, 10, 10, 10], [8, 6, 5, 10, 10, 10, 10])])
    f.append(web('V-03', 'Tinjau laporan harian', 'Supervisor mencocokkan laporan dengan uang dan slip. Setujui (kas pindah ke brankas), Tahan (catatan wajib), atau Tolak (shift dibuka kembali, catatan wajib).', 'supervisor', 'Laporan harian',
                 head('Laporan harian · Siti Rahma', '2 Nov 2026 · ditutup 14:30 WIB', btn('Unduh PDF'), badge('Menunggu verifikasi')) +
                 stats([('Saldo awal', rp(1_110_000)), ('Setoran', rp(1_030_000, '+')), ('Penarikan', rp(300_000, '−')), ('Kas sistem', rp(1_840_000)), ('Uang fisik', rp(1_840_000)), ('Selisih', rp(0))]) +
                 row(box(counts, 'Hitungan kas', style='width:380px'),
                     box(col(field('Catatan', placeholder='Wajib diisi untuk Tahan dan Tolak', kind='area'),
                             btns(btn('Tolak'), btn('Tahan'), btn('Setujui', 'pri lg'), cls='end'),
                             '<span class="hint">Setujui bersifat final dan memindahkan kas ke brankas. Tolak membuka kembali shift teller.</span>'), 'Keputusan', cls='grow')) +
                 box(table([('No.', 70, 'l'), ('Waktu', 90, 'l'), ('Jenis', 150, 'l'), ('Nasabah', None, 'l'), ('Jumlah', 150, 'r')], TX_ROWS), 'Transaksi (12)')))

    f.append(web_dialog('V-04', 'Konfirmasi setujui laporan', 'Konfirmasi sebelum menyetujui karena tindakan final.',
                        '<h2 style="font-size:20px">Setujui laporan harian?</h2>' +
                        f'<span class="muted">Kas {rp(1_840_000)} dari laci Siti Rahma dipindahkan ke brankas. Laporan tidak dapat diubah lagi.</span>' +
                        dl([('Teller', 'Siti Rahma'), ('Tanggal', '2 Nov 2026'), ('Dipindahkan ke brankas', rp(1_840_000))]) +
                        btns(btn('Batal'), btn('Setujui', 'pri'), cls='end')))

    f.append(web_dialog('V-05', 'Tolak laporan', 'Menolak membuka kembali shift agar teller bisa mengoreksi dan menutup ulang. Bisa gagal bila teller sedang menjalankan shift lain (sarankan Tahan).',
                        '<h2 style="font-size:20px">Tolak laporan harian?</h2>' +
                        '<span class="muted">Shift Siti Rahma tanggal 2 Nov 2026 dibuka kembali. Teller melihat catatan ini.</span>' +
                        field('Catatan untuk teller (wajib)', 'Slip #127 tidak ada, cek ulang setoran Budi Santoso.', kind='area') +
                        btns(btn('Batal'), btn('Tolak laporan', 'pri'), cls='end')))

    f.append(web('V-06', 'Brankas', 'Riwayat pemindahan kas dari laci teller ke brankas (terjadi otomatis saat laporan disetujui).', 'supervisor', 'Brankas',
                 head('Brankas') +
                 row(box(row(field('Dari', '01/11/2026', width=160), field('Sampai', '02/11/2026', width=160), select('Teller', 'Semua teller', 200), btn('Terapkan', 'pri'), cls='e'), cls='grow'),
                     box(col('<span class="k">Total masuk brankas</span>', f'<span class="amt">{rp(3_680_000)}</span>', cls='tight'), style='width:300px')) +
                 box(table([('Waktu', 150, 'l'), ('Teller', None, 'l'), ('Laporan', 140, 'l'), ('Disetujui oleh', None, 'l'), ('Jumlah', 150, 'r')],
                           [['2 Nov 2026 15:02', 'Siti Rahma', '1 Nov 2026', 'Pak Hendra', rp(1_840_000)], ['1 Nov 2026 15:10', 'Rudi Hartono', '31 Okt 2026', 'Pak Hendra', rp(1_840_000)]]))))

    f.append(web('V-07', 'Nasabah (lihat saja)', 'Supervisor dapat melihat rekening dan mengunduh mutasi, tetapi tidak dapat membuat atau mengubah.', 'supervisor', 'Nasabah',
                 head('Nasabah') +
                 box(row(field('Cari', placeholder='Nama / NIS / rekening', width=260), select('Jurusan', 'Semua', 160), select('Kelas', 'Semua', 120), select('Status', 'Aktif', 140), btn('Terapkan', 'pri'), cls='e')) +
                 box(table([('NIS', 100, 'l'), ('Nama', None, 'l'), ('Rekening', 140, 'l'), ('Kelas', 110, 'l'), ('Status', 110, 'l'), ('Aplikasi', 130, 'l'), ('Saldo', 130, 'r')], CUSTOMER_ROWS))))

    f.append(web('V-08', 'Staf (lihat saja)', 'Daftar teller dan supervisor, hanya dibaca.', 'supervisor', 'Staf',
                 head('Staf') +
                 box(row(field('Cari', placeholder='Nama / username', width=260), select('Peran', 'Semua', 160), select('Status', 'Aktif', 140), btn('Terapkan', 'pri'), cls='e')) +
                 box(table([('Username', 150, 'l'), ('Nama', None, 'l'), ('Peran', 120, 'l'), ('Kelas', 110, 'l'), ('No. HP', 150, 'l'), ('Status', 110, 'l')], STAFF_ROWS))))

    f += audit_pages('supervisor', 'V', 9)
    return page('Wireframe — Supervisor', 'Web staf (1280 × 800). Supervisor memverifikasi laporan harian teller satu per satu, memantau brankas, dan membaca log audit.', f, 'supervisor.html')


# ================================================================= ADMIN

def admin():
    f = [staff_login('S-01')]
    f.append(web('A-01', 'Dasbor admin', 'Jumlah nasabah dan staf, nasabah yang belum aktivasi aplikasi, neraca hari ini, dan pintasan tugas.', 'admin', 'Dasbor',
                 head('Dasbor', 'Senin, 2 November 2026') +
                 stats([('Nasabah aktif', '412'), ('Dibekukan', '3'), ('Lulus / ditutup', '96'), ('Belum aktivasi aplikasi', '57')]) +
                 stats([('Teller', '18'), ('Supervisor', '2'), ('Neraca hari ini', 'Seimbang')]) +
                 box(btns(btn('Buka rekening', 'pri'), btn('Tambah staf'), btn('Impor staf'), btn('Pengaturan')), 'Pintasan')))

    act = btns(btn('Ubah', 'sm'), btn('Blokir', 'sm'), btn('Hapus', 'sm'))
    srows = [r + [act] for r in STAFF_ROWS]
    srows.insert(0, ['admin', 'Admin Sekolah', 'Administrator', '—', '—', badge('Aktif'), '<span class="muted small">tidak dapat diubah</span>'])
    f.append(web('A-02', 'Daftar staf', 'Kelola teller dan supervisor: tambah, ubah, blokir/buka blokir, hapus (staf yang punya riwayat hanya bisa diblokir).', 'admin', 'Staf',
                 head('Staf', '', btns(btn('Impor dari Excel'), btn('Tambah staf', 'pri'))) +
                 box(row(field('Cari', placeholder='Nama / username', width=260), select('Peran', 'Semua', 160), select('Status', 'Aktif', 140), btn('Terapkan', 'pri'), cls='e')) +
                 box(table([('Username', 120, 'l'), ('Nama', None, 'l'), ('Peran', 110, 'l'), ('Kelas', 90, 'l'), ('No. HP', 130, 'l'), ('Status', 90, 'l'), ('Aksi', 230, 'l')], srows))))

    f.append(web('A-03', 'Tambah / ubah staf', 'Form staf. Kata sandi wajib saat membuat, opsional saat mengubah. Peran hanya teller atau supervisor.', 'admin', 'Staf',
                 head('Tambah staf') +
                 box(col(row(col(field('Username', 'siti.teller'), cls='grow'), col(field('Nama lengkap', 'Siti Rahma'), cls='grow')),
                         row(col(field('Kata sandi', '••••••••', hint='Minimal 8 karakter.'), cls='grow'), col(field('No. HP / WA', '0812-3456-7890'), cls='grow')),
                         '<div class="lbl">Peran</div>' + row(col(radio('Teller', 'Melayani setor dan tarik di loket.', True), cls='grow'), col(radio('Supervisor', 'Memverifikasi laporan harian.'), cls='grow')),
                         row(col(field('Kelas', 'XI AKL 1', hint='Untuk teller dari siswa piket.'), cls='grow'), col(cls='grow')),
                         btns(btn('Batal'), btn('Simpan', 'pri'), cls='end')), style='max-width:760px')))

    f.append(web('A-04', 'Impor staf', 'Unggah daftar piket (.xlsx/.csv, maks 2 MB, 500 baris). Jika ada baris salah, tidak ada yang disimpan. Kata sandi yang dibuat sistem ditampilkan sekali.', 'admin', 'Staf',
                 head('Impor staf') +
                 row(box(col('<div class="drop"><b>Tarik file ke sini atau pilih file</b><span class="muted small">.xlsx atau .csv · maks 2 MB · maks 500 baris</span>' + btn('Pilih file') + '</div>',
                             '<span class="hint">Kolom: Nama, Username, Kelas, No WA, Kata sandi (opsional).</span>', btn('Impor', 'pri')), 'Unggah file', style='width:420px'),
                     box(col(alert('12 teller dibuat', 'Catat atau cetak kata sandi sekarang. Kata sandi tidak dapat dilihat lagi.'),
                             table([('Username', None, 'l'), ('Nama', None, 'l'), ('Kata sandi', 140, 'l')],
                                   [['rina.teller', 'Rina Wati', 'k7Qm-29Lp'], ['bayu.teller', 'Bayu Saputra', 'x3Tn-88Re'], ['dian.teller', 'Dian Puspita', 'p5Wa-41Kd']]),
                             btns(btn('Salin'), btn('Cetak'))), 'Hasil impor', cls='grow'))))

    crows = [r + [btn('Detail', 'sm')] for r in CUSTOMER_ROWS]
    f.append(web('A-05', 'Daftar nasabah', 'Cari dan saring rekening, termasuk status aktivasi aplikasi (menunggu / teraktivasi).', 'admin', 'Nasabah',
                 head('Nasabah', '', btn('Buka rekening', 'pri')) +
                 box(row(field('Cari', placeholder='Nama / NIS / rekening', width=230), select('Jurusan', 'Semua', 140), select('Kelas', 'Semua', 100), select('Rombel', 'Semua', 100),
                         select('Status', 'Aktif', 120), select('Aktivasi', 'Semua', 130), btn('Terapkan', 'pri'), cls='e')) +
                 box(table([('NIS', 90, 'l'), ('Nama', None, 'l'), ('Rekening', 130, 'l'), ('Kelas', 100, 'l'), ('Status', 110, 'l'), ('Aplikasi', 120, 'l'), ('Saldo', 120, 'r'), ('', 90, 'r')], crows))))

    f.append(web('A-06', 'Buka rekening', 'Admin membuat rekening siswa. Email wajib: link aktivasi aplikasi dikirim ke email ini (berlaku 24 jam). Nomor rekening dibuat otomatis.', 'admin', 'Nasabah',
                 head('Buka rekening') +
                 box(col(row(col(field('NIS', '20260004'), cls='grow'), col(field('Nama lengkap', 'Dewi Anggraini'), cls='grow')),
                         field('Email', 'dewi.anggraini@gmail.com', hint='Wajib. Link aktivasi aplikasi E-Teller dikirim ke email ini.'),
                         row(col(select('Kelas', 'X'), cls='grow'), col(select('Jurusan', 'Akuntansi (AKL)'), cls='grow'), col(field('Rombel', '1'), cls='grow')),
                         row(col(field('PIN awal (6 digit)', '••••••', hint='Berikan ke siswa secara langsung. Dipakai untuk membuka aplikasi dan menyetujui penarikan.'), cls='grow'), col(cls='grow')),
                         btns(btn('Batal'), btn('Buka rekening', 'pri'), cls='end')), style='max-width:760px')))

    f.append(web('A-07', 'Rekening dibuat', 'Hasil: nomor rekening dan status email undangan. Jika email gagal terkirim, admin dapat mengirim ulang.', 'admin', 'Nasabah',
                 head('Rekening dibuat') +
                 box(col(col('<span class="k">Nomor rekening</span>', '<span class="amt">AKL-2026-001</span>', cls='tight'),
                         dl([('Nama', 'Dewi Anggraini'), ('NIS', '20260004'), ('Kelas', 'X AKL 1'), ('Email', 'dewi.anggraini@gmail.com'), ('Aktivasi aplikasi', badge('Menunggu'))]),
                         alert('Undangan aktivasi terkirim', 'Email berisi link aktivasi berlaku sampai 3 Nov 2026 10:20 WIB.'),
                         alert('Jika email gagal terkirim', 'Rekening tetap dibuat. Tampilkan tombol "Kirim ulang undangan".'),
                         btns(btn('Kirim ulang undangan'), btn('Cetak kartu'), btn('Ke detail nasabah', 'pri'))), style='max-width:760px')))

    hist = table([('Waktu', 130, 'l'), ('No.', 70, 'l'), ('Jenis', 130, 'l'), ('Teller', None, 'l'), ('Jumlah', 130, 'r'), ('Saldo', 130, 'r')],
                 [['2 Nov 10:15', '#130', 'Setor tunai', 'Siti Rahma', rp(250_000, '+'), rp(320_000)], ['1 Nov 09:02', '#101', 'Setor tunai', 'Rudi Hartono', rp(70_000, '+'), rp(70_000)]])
    f.append(web('A-08', 'Detail nasabah', 'Data rekening, status aktivasi aplikasi, saldo, mutasi PDF, dan aksi: ubah, reset PIN, bekukan, cetak kartu, kirim ulang undangan, luluskan.', 'admin', 'Nasabah',
                 head('Andi Pratama', 'DKV-2026-001 · NIS 20260002', btns(btn('Cetak kartu'), btn('Ubah', 'pri')), badge('Aktif') + badge('Belum aktivasi')) +
                 row(box(dl([('NIS', '20260002'), ('Rekening', 'DKV-2026-001'), ('Kelas', 'XI DKV 1'), ('Jurusan', 'Desain Komunikasi Visual'),
                             ('Email', 'andi.pratama@gmail.com'), ('Aplikasi', 'Menunggu aktivasi · undangan 1 Nov 08:00'), ('PIN', 'Normal')]), 'Data rekening', cls='grow'),
                     col(box(col('<span class="k">Saldo</span>', f'<span class="amt">{rp(320_000)}</span>', row(field('Dari', '01/10/2026'), field('Sampai', '02/11/2026')), btn('Unduh mutasi PDF'), cls='tight')),
                         box(btns(btn('Kirim ulang undangan', 'sm'), btn('Reset PIN', 'sm'), btn('Bekukan', 'sm'), btn('Luluskan', 'sm'), cls='')), style='width:420px')) +
                 box(hist, 'Riwayat transaksi')))

    f.append(web('A-09', 'Ubah rekening', 'Ubah data siswa, status (aktif/dibekukan), atau PIN baru (juga membuka blokir PIN). Email hanya bisa diubah selama aktivasi masih menunggu; setelah diubah kirim ulang undangan.', 'admin', 'Nasabah',
                 head('Ubah rekening', 'DKV-2026-001 · nomor rekening dan saldo tidak dapat diubah') +
                 box(col(row(col(field('NIS', '20260002'), cls='grow'), col(field('Nama lengkap', 'Andi Pratama'), cls='grow')),
                         field('Email', 'andi.pratama@gmail.com', hint='Dapat diubah karena aktivasi belum selesai. Link lama otomatis tidak berlaku.'),
                         row(col(select('Kelas', 'XI'), cls='grow'), col(select('Jurusan', 'DKV'), cls='grow'), col(field('Rombel', '1'), cls='grow')),
                         '<div class="lbl">Status rekening</div>' + row(col(radio('Aktif', 'Dapat bertransaksi.', True), cls='grow'), col(radio('Dibekukan', 'Hanya dapat melihat saldo.'), cls='grow')),
                         row(col(field('PIN baru (opsional)', placeholder='Kosongkan jika tidak diganti', hint='PIN baru juga membuka blokir PIN.'), cls='grow'), col(cls='grow')),
                         btns(btn('Batal'), btn('Simpan', 'pri'), cls='end')), style='max-width:760px')))

    card = ('<div class="card">' + ph(130, 130, 'QR') +
            '<div class="col tight"><b style="font-size:16px">Andi Pratama</b><span>DKV-2026-001</span><span class="muted small">NIS 20260002</span>'
            '<span class="muted small">XI DKV 1</span><span class="small" style="margin-top:12px"><b>Bank Mini Sekolah</b></span></div></div>')
    f.append(web('A-10', 'Cetak kartu nasabah', 'Kartu dengan QR untuk dipindai teller di loket. Dicetak lewat browser.', 'admin', 'Nasabah',
                 head('Kartu nasabah', '', btn('Cetak', 'pri')) + box(col(card, '<span class="hint">Ukuran kartu 85,6 × 54 mm.</span>', cls='center'))))

    f.append(web_dialog('A-11', 'Luluskan (tutup) rekening', 'Konfirmasi kuat. Peringatan bila saldo masih ada: saldo tetap tercatat tetapi tidak dapat ditarik, dan tidak ada pembatalan.',
                        '<h2 style="font-size:20px">Luluskan dan tutup rekening?</h2>' +
                        alert(f'Saldo masih {rp(320_000)}', 'Tarik saldo di loket terlebih dahulu. Setelah ditutup, saldo tidak dapat ditarik dan tindakan ini tidak dapat dibatalkan.') +
                        dl([('Nasabah', 'Andi Pratama'), ('Rekening', 'DKV-2026-001')]) +
                        field('Ketik nomor rekening untuk konfirmasi', placeholder='DKV-2026-001') +
                        btns(btn('Batal'), btn('Luluskan', 'pri'), cls='end')))

    f.append(web('A-12', 'Pengaturan', 'Saldo minimum, mode pemindai QR di loket, dan cara verifikasi penarikan.', 'admin', 'Pengaturan',
                 head('Pengaturan') +
                 box(col(field('Saldo minimum', '10.000', hint='Rp0 – Rp1.000.000. Saldo nasabah tidak boleh turun di bawah nilai ini.', width=320),
                         '<div class="lbl">Pemindai QR di loket</div>' + row(col(radio('Kamera (webcam)', '', True), cls='grow'), col(radio('Pemindai USB'), cls='grow'), col(radio('Nonaktif (ketik manual)'), cls='grow')),
                         '<div class="lbl">Verifikasi penarikan</div>' +
                         col(radio('Aplikasi nasabah (disarankan)', 'Nasabah menyetujui dengan PIN di HP-nya. Teller tidak pernah memegang PIN.', True),
                             radio('PIN di loket', 'Nasabah mengetik PIN di layar teller.'),
                             radio('Keduanya', 'Teller dapat memilih salah satu.'), cls=''),
                         btns(btn('Simpan', 'pri'))), style='max-width:760px')))

    f += audit_pages('admin', 'A', 13)
    return page('Wireframe — Admin', 'Web staf (1280 × 800). Admin mengelola staf, rekening nasabah (termasuk email untuk aktivasi aplikasi), pengaturan, dan membaca log audit.', f, 'admin.html')


# ================================================================= CUSTOMER (mobile)

def keypad():
    rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']]
    return '<div class="keypad">' + ''.join(
        '<div class="krow">' + ''.join(f'<div class="key{" blank" if k == "" else ""}">{k}</div>' for k in r) + '</div>' for r in rows) + '</div>'


def pins(filled):
    return '<div class="pins">' + ''.join(f'<div class="pin{" f" if i < filled else ""}"></div>' for i in range(6)) + '</div>'


def gbtn(text):
    return f'<div class="btn lg gbtn"><div class="gl"></div><span>{E(text)}</span></div>'


def sep():
    return '<div class="sep"><div class="ln"></div><span>atau</span><div class="ln"></div></div>'


def mlogo():
    return '<div class="logo"><div class="mark"></div><div class="t"><b>E-Teller</b><span>Bank Mini Sekolah</span></div></div>'


def customer():
    f = []
    f.append(mrow(
        mobile('C-01', 'Aktivasi akun', 'Dibuka dari link di email undangan. Akun Google atau kata sandi harus memakai email yang didaftarkan admin.',
               mlogo() + '<h2 style="font-size:22px">Aktivasi akun</h2>' +
               box(dl([('Nama', 'Budi Santoso'), ('Rekening', 'RPL-2026-001'), ('Email', 'budi.santoso@gmail.com')]), style='padding:12px') +
               '<span class="hint">Link berlaku sampai 3 Nov 2026 10:00 WIB.</span>' +
               gbtn('Lanjutkan dengan Google') + sep() +
               field('Buat kata sandi', '••••••••') + field('Ulangi kata sandi', '••••••••') + btn('Aktivasi', 'pri lg')),
        mobile('C-02', 'Verifikasi email', 'Jika memilih kata sandi, nasabah harus memverifikasi email dulu.',
               mlogo() + '<div style="height:24px"></div>' + col(ph(96, 96, 'email'), '<h2 style="font-size:22px">Cek email Anda</h2>',
                                                                '<span class="muted">Kami mengirim link verifikasi ke b***@gmail.com. Buka link itu, lalu kembali ke sini.</span>', cls='center') +
               '<div class="spacer"></div>' + btns(btn('Saya sudah verifikasi', 'pri lg'), btn('Kirim ulang email'), cls='st')),
        mobile('C-03', 'Link kedaluwarsa', 'Link aktivasi tidak valid, sudah dipakai, atau kedaluwarsa. Minta link baru dengan NIS + PIN; link dikirim ke email terdaftar.',
               mlogo() + alert('Link aktivasi tidak berlaku', 'Link sudah kedaluwarsa atau sudah dipakai.') +
               '<h2 style="font-size:20px">Minta link baru</h2>' + field('NIS atau nomor rekening', '20260001') + field('PIN (6 digit)', '••••••') +
               btn('Kirim link baru', 'pri lg') + '<span class="hint">Link baru dikirim ke email yang didaftarkan admin.</span>'),
        mobile('C-04', 'Masuk', 'Login dengan Google atau email + kata sandi (Firebase). NIS + PIN tidak lagi dipakai untuk login.',
               mlogo() + '<div style="height:16px"></div><h2 style="font-size:24px">Masuk</h2>' +
               gbtn('Masuk dengan Google') + sep() + field('Email', 'budi.santoso@gmail.com') + field('Kata sandi', '••••••••') +
               '<span class="small" style="text-decoration:underline">Lupa kata sandi?</span>' + btn('Masuk', 'pri lg') +
               '<div class="spacer"></div><span class="hint">Belum punya akun? Akun dibuat oleh admin bank mini. Aktivasi lewat email undangan.</span>'),
    ))
    f.append(mrow(
        mobile('C-05', 'Lupa kata sandi', 'Reset lewat email (Firebase). Pesan konfirmasi selalu sama, terdaftar atau tidak.',
               field('Email', 'budi.santoso@gmail.com') + btn('Kirim link reset', 'pri lg') +
               alert('Jika email terdaftar, link reset kata sandi sudah dikirim.'), title='Lupa kata sandi', back=True),
        mobile('C-06', 'Buka kunci dengan PIN', 'Setiap aplikasi dibuka (sesi berlaku 30 hari), nasabah memasukkan PIN 6 digit. 3 kali salah → PIN diblokir sementara.',
               '<div style="height:24px"></div>' + col('<h2 style="font-size:22px">Halo, Budi</h2>', '<span class="muted">Masukkan PIN untuk membuka aplikasi</span>', cls='center tight') +
               '<div style="height:12px"></div>' + pins(3) + '<div class="err" style="align-self:center">PIN salah. Sisa 2 percobaan.</div>' +
               '<div class="spacer"></div>' + keypad() + '<span class="small" style="align-self:center;text-decoration:underline">Keluar</span>'),
        mobile('C-07', 'Beranda', 'Saldo, saldo minimum, status rekening, transaksi terakhir. Banner muncul bila teller mengirim permintaan penarikan.',
               col('<span class="muted">Halo,</span>', '<b style="font-size:20px">Budi Santoso</b>', cls='tight') +
               alert('Permintaan penarikan Rp100.000', 'Dari teller Siti Rahma · sisa 01:42 → Tinjau') +
               box(col(row('<span class="k">Saldo</span>', badge('Aktif'), cls='c sb'), f'<span class="amt">{rp(1_250_000)}</span>',
                       f'<span class="muted small">Saldo minimum {rp(10_000)} · per 2 Nov 10:40</span>', cls='tight'), style='padding:14px') +
               row('<b>Transaksi terakhir</b>', '<span class="small" style="text-decoration:underline">Lihat semua</span>', cls='c sb') +
               '<div class="list">' + ''.join(
                   f'<div class="li{" first" if i == 0 else ""}"><div class="a"><b>{d}</b><span class="muted small">{t}</span></div><b>{a}</b></div>'
                   for i, (d, t, a) in enumerate([('Setor tunai', '2 Nov 09:12', rp(100_000, '+')), ('Tarik tunai', '1 Nov 11:30', rp(20_000, '−')), ('Setor tunai', '31 Okt 10:05', rp(50_000, '+'))])) + '</div>',
               tab='Beranda'),
        mobile('C-08', 'Riwayat transaksi', 'Mutasi dengan filter jenis dan tanggal; gulir untuk memuat lebih banyak.',
               '<div class="chips"><span class="chip on">Semua</span><span class="chip">Masuk</span><span class="chip">Keluar</span></div>' +
               row(col(field('', '01/10/2026'), cls='grow'), col(field('', '02/11/2026'), cls='grow')) +
               '<span class="k">2 November 2026</span>' +
               '<div class="list">' + ''.join(
                   f'<div class="li{" first" if i == 0 else ""}"><div class="a"><b>{d}</b><span class="muted small">{t} · saldo {s}</span></div><b>{a}</b></div>'
                   for i, (d, t, a, s) in enumerate([('Tarik tunai', '10:42', rp(100_000, '−'), rp(1_150_000)), ('Setor tunai', '09:12', rp(100_000, '+'), rp(1_250_000))])) + '</div>' +
               '<span class="k">1 November 2026</span>' +
               '<div class="list">' + ''.join(
                   f'<div class="li{" first" if i == 0 else ""}"><div class="a"><b>{d}</b><span class="muted small">{t} · saldo {s}</span></div><b>{a}</b></div>'
                   for i, (d, t, a, s) in enumerate([('Tarik tunai', '11:30', rp(20_000, '−'), rp(1_150_000)), ('Setor tunai', '08:05', rp(70_000, '+'), rp(1_170_000))])) + '</div>',
               title='Riwayat', tab='Riwayat'),
    ))
    f.append(mrow(
        mobile('C-09', 'Detail transaksi', 'Rincian satu transaksi, termasuk persetujuan via aplikasi untuk penarikan.',
               col(f'<span class="amt">{rp(100_000, "−")}</span>', '<span class="muted">Tarik tunai · 2 Nov 2026 10:42</span>', cls='center tight') +
               box(dl([('No. transaksi', '#131'), ('Teller', 'Siti Rahma'), ('Saldo sebelum', rp(1_250_000)), ('Saldo sesudah', rp(1_150_000)), ('Persetujuan', 'Aplikasi · 10:41')]), style='padding:12px'),
               title='Detail transaksi', back=True),
        mobile('C-10', 'Kartu digital', 'QR untuk dipindai teller di loket, dengan nama, nomor rekening, NIS, dan kelas.',
               box(col(ph(220, 220, 'QR'), '<b style="font-size:18px">Budi Santoso</b>', '<span>RPL-2026-001</span>', '<span class="muted small">NIS 20260001 · X RPL 1</span>', cls='center tight'), style='align-items:center;padding:20px') +
               '<span class="hint" style="text-align:center">Tunjukkan QR ini ke teller saat setor atau tarik.</span>',
               title='Kartu', tab='Kartu'),
        mobile('C-11', 'Permintaan penarikan', 'Teller mengirim permintaan; nasabah melihat jumlah, teller, saldo sesudah, dan sisa waktu. Tolak atau Setujui dengan PIN.',
               col('<span class="k">Tarik tunai</span>', f'<span class="amt xl">{rp(100_000)}</span>', '<span class="muted small">seratus ribu rupiah</span>', cls='center tight') +
               box(dl([('Teller', 'Siti Rahma'), ('Saldo sekarang', rp(1_250_000)), ('Saldo sesudah', rp(1_150_000))]), style='padding:12px') +
               col('<div class="ring" style="width:90px;height:90px;font-size:18px;border-width:6px">01:38</div>', '<span class="muted small">sisa waktu</span>', cls='center tight') +
               alert('Setujui hanya jika Anda sedang di loket.') + '<div class="spacer"></div>' +
               btns(btn('Setujui dengan PIN', 'pri lg'), btn('Tolak'), cls='st'),
               title='Permintaan penarikan', back=True),
        mobile('C-12', 'PIN untuk menyetujui', 'PIN dimasukkan di HP nasabah, tidak disimpan, dikosongkan setelah tiap percobaan.',
               col('<b style="font-size:18px">Masukkan PIN</b>', f'<span class="muted">untuk menyetujui penarikan {rp(100_000)}</span>', cls='center tight') +
               '<div style="height:8px"></div>' + pins(4) + '<div class="spacer"></div>' + keypad() + btn('Batal'),
               title='Setujui penarikan', back=True),
    ))
    f.append(mrow(
        mobile('C-13', 'Penarikan disetujui', 'Setelah disetujui, nasabah menunjukkan layar ke teller. Teller menyelesaikan penarikan di loket.',
               '<div style="height:32px"></div>' + col(ph(88, 88, '✓'), '<h2 style="font-size:22px">Penarikan disetujui</h2>',
                                                      '<span class="muted">Tunjukkan layar ini ke teller. Teller akan menyelesaikan penarikan dan memberikan uang.</span>', cls='center') +
               box(dl([('Jumlah', rp(100_000)), ('Teller', 'Siti Rahma'), ('Disetujui', '2 Nov 2026 10:41')]), style='padding:12px') +
               '<div class="spacer"></div>' + btn('Kembali ke beranda', 'pri lg')),
        mobile('C-14', 'Profil', 'Data nasabah dan menu akun: ganti PIN, ubah kata sandi, unduh mutasi, keluar (perangkat ini / semua perangkat).',
               box(dl([('Nama', 'Budi Santoso'), ('NIS', '20260001'), ('Rekening', 'RPL-2026-001'), ('Kelas', 'X RPL 1'), ('Email', 'budi.santoso@gmail.com')]), style='padding:12px') +
               '<div class="list">' + ''.join(f'<div class="li{" first" if i == 0 else ""}"><span>{t}</span><span class="muted">›</span></div>'
                                              for i, t in enumerate(['Ganti PIN', 'Ubah kata sandi', 'Unduh mutasi (PDF)', 'Keluar', 'Keluar dari semua perangkat'])) + '</div>',
               title='Profil', tab='Profil'),
        mobile('C-15', 'Ganti PIN', 'PIN lama, PIN baru, dan ulangi. PIN baru harus berbeda dan cocok.',
               field('PIN lama', '••••••') + field('PIN baru', '••••••') + field('Ulangi PIN baru', '••••••', error='PIN tidak sama.') +
               btn('Simpan PIN', 'pri lg'), title='Ganti PIN', back=True),
        mobile('C-16', 'Unduh mutasi', 'Pilih rentang tanggal, unduh PDF, lalu buka/bagikan dengan aplikasi HP.',
               field('Dari tanggal', '01/10/2026') + field('Sampai tanggal', '02/11/2026') + btn('Unduh PDF', 'pri lg') +
               '<span class="hint">File dibuka dengan penampil PDF di HP.</span>', title='Unduh mutasi', back=True),
    ))
    f.append(mrow(
        mobile('C-17', 'Ubah kata sandi', 'Hanya untuk akun email + kata sandi (bukan Google). Masukkan kata sandi lama untuk konfirmasi.',
               field('Kata sandi lama', '••••••••') + field('Kata sandi baru', '••••••••') + field('Ulangi kata sandi baru', '••••••••') +
               btn('Simpan', 'pri lg'), title='Ubah kata sandi', back=True),
    ))
    return page('Wireframe — Nasabah (aplikasi HP)', 'Aplikasi mobile (375 × 812). Nasabah aktivasi akun dari email, masuk dengan Google atau email, membuka aplikasi dengan PIN, melihat saldo, dan menyetujui penarikan dari teller.', f, 'customer-app.html')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for fn in (teller, supervisor, admin, customer):
        print(fn())
