import { describe, expect, it } from 'vitest';
import { watermarkBackground } from './watermark';

const svgDe = (css: string) =>
  decodeURIComponent(css.replace(/^url\("data:image\/svg\+xml,/, '').replace(/"\)$/, ''));

describe('marca de agua del fondo', () => {
  it('es un url() de CSS con el texto y el color dados', () => {
    const css = watermarkBackground('LA MILONGUITA', '#0b1630');
    expect(css.startsWith('url("data:image/svg+xml,')).toBe(true);
    const svg = svgDe(css);
    expect(svg).toContain('>LA MILONGUITA</text>');
    expect(svg).toContain("fill='#0b1630'");
  });

  it('escapa lo que rompería el SVG', () => {
    expect(svgDe(watermarkBackground('PAPAS & <CO>', '#000'))).toContain('PAPAS &amp; &lt;CO&gt;');
  });

  it('achica la letra en nombres largos para que no se corte', () => {
    const tamano = (t: string) => Number(/font-size='(\d+)'/.exec(svgDe(watermarkBackground(t, '#000')))?.[1]);
    expect(tamano('GORDOS')).toBe(24);
    expect(tamano('LA PARRILLA DEL BARRIO NORTE')).toBeLessThan(24);
  });
});
