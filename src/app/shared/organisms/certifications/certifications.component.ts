import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../../atoms/section-title/section-title.component';

/** Eje por el que se agrupa la lista: área de conocimiento o empresa emisora. */
export type GroupMode = 'area' | 'issuer';

/**
 * Áreas de conocimiento. Para añadir una nueva basta con declararla aquí y
 * usarla en `certifications`: los grupos se derivan solos de los datos.
 */
export type SkillArea = 'Backend' | 'Frontend' | 'Cybersecurity' | 'AI' | 'Languages' | 'Networking';

/** Orden fijo de las áreas; las no listadas caen al final, alfabéticamente. */
const AREA_ORDER: SkillArea[] = ['Backend', 'Frontend', 'Cybersecurity', 'AI', 'Languages', 'Networking'];

/** Grupo para las certificaciones sin emisor declarado. */
const NO_ISSUER = 'Other';

export interface Certification {
  /** Nombre exacto tal y como aparece en el certificado. */
  name: string;
  /** Empresa/institución emisora. Vacío => se agrupa bajo "Other". */
  issuer: string;
  /** Logo del emisor (URL remota o ruta `assets/...`). Sin logo se usa un icono. */
  issuerLogo?: string;
  area: SkillArea;
  /** Emisión en formato 'YYYY-MM'. Se formatea sola (ver `formatIssued`). */
  issued: string;
  /** Enlace público de verificación (Credly, Coursera, AWS...). */
  credentialUrl?: string;
}

interface CertGroup {
  label: string;
  items: Certification[];
}

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent],
  templateUrl: './certifications.component.html',
  styleUrl: './certifications.component.scss',
})
export class CertificationsComponent {
  /**
   * ─────────────────────────────────────────────────────────────────────────
   *  DATOS REALES — RELLENAR AQUÍ
   * ─────────────────────────────────────────────────────────────────────────
   *
   *  Plantilla para copiar y pegar:
   *
   *    {
   *      name: 'AWS Certified Cloud Practitioner',
   *      issuer: 'Amazon Web Services',
   *      issuerLogo: 'assets/logos/aws.svg',   // opcional
   *      area: 'Backend',                      // ver SkillArea
   *      issued: '2025-11',                    // 'YYYY-MM'
   *      credentialUrl: 'https://...'          // opcional
   *    },
   *
   *  Campos opcionales: si falta `issuerLogo` se dibuja un icono; si falta
   *  `credentialUrl` la tarjeta simplemente no muestra el enlace "Verify".
   * ─────────────────────────────────────────────────────────────────────────
   */
  protected certifications: Certification[] = [
    {
      name: 'English B2 — Upper Intermediate',
      issuer: 'EF SET',
      issuerLogo:
        'https://a.storyblok.com/f/204637/1200x1200/9e2da2437f/ef-logo.png',
      area: 'Languages',
      issued: '2026-07',
      credentialUrl: 'https://cert.efset.org/es/a4jsCZ',
    },
    {
      name: 'CCNA: Fundamentos de Conmutación, Enrutamiento y Redes Inalámbricas',
      issuer: 'Cisco',
      issuerLogo: 'https://www.citypng.com/public/uploads/preview/cisco-square-blue-logo-icon-png-735811696612218gzoiadfplh.png',
      area: 'Networking',
      issued: '2026-06',
      credentialUrl: 'https://www.linkedin.com/in/juan-david-vela-coronado-a609b7266/',
    },
    {
      name: 'Getting Started with Deep Learning',
      issuer: 'NVIDIA',
      issuerLogo: 'https://www.nvidia.com/content/dam/en-zz/ja/Solutions/about-us/press-releases/Enterprise-jp-press-release-page-facebook-og-1200x630@2x.jpg',
      area: 'AI',
      issued: '2026-05',
      credentialUrl: 'https://learn.nvidia.com/certificates?id=y6I2VpAaTWyYNAgV5fnFlQ',
    },
    {
      name: 'CCNA: Introducción a las redes',
      issuer: 'Cisco',
      issuerLogo: 'https://www.citypng.com/public/uploads/preview/cisco-square-blue-logo-icon-png-735811696612218gzoiadfplh.png',
      area: 'Networking',
      issued: '2026-04',
      credentialUrl: 'https://www.linkedin.com/in/juan-david-vela-coronado-a609b7266/',
    },
    {
      name: 'Junior Cybersecurity Analyst Career Path',
      issuer: 'Cisco',
      issuerLogo: 'https://www.citypng.com/public/uploads/preview/cisco-square-blue-logo-icon-png-735811696612218gzoiadfplh.png',
      area: 'Cybersecurity',
      issued: '2025-12',
      credentialUrl: 'https://www.credly.com/badges/a917b782-b2b7-47d4-bf1c-5d370a6df267/linked_in_profile',
    },
    {
      name: 'Full Stack Empresarial con Spring Boot y Angular',
      issuer: 'Dev Senior Code',
      issuerLogo: 'https://www.devseniorcode.com/images/brand/original.webp', // TODO: logo de Dev Senior Code
      area: 'Backend',
      issued: '2025-11',
      credentialUrl: 'https://www.linkedin.com/in/juan-david-vela-coronado-a609b7266/',
    },
  ];

  /** Eje activo del control segmentado. */
  protected mode = signal<GroupMode>('area');

  protected hasCertifications = computed(() => this.certifications.length > 0);

  /** Agrupa y ordena según el eje activo. Cambiar de eje reconstruye la lista. */
  protected groups = computed<CertGroup[]>(() => {
    const mode = this.mode();
    const map = new Map<string, Certification[]>();

    for (const cert of this.certifications) {
      const key = mode === 'area' ? cert.area : cert.issuer.trim() || NO_ISSUER;
      const bucket = map.get(key);
      if (bucket) bucket.push(cert);
      else map.set(key, [cert]);
    }

    const groups: CertGroup[] = [...map.entries()].map(([label, items]) => ({
      label,
      // Dentro del grupo, lo más reciente primero.
      items: [...items].sort((a, b) => b.issued.localeCompare(a.issued)),
    }));

    return groups.sort(
      (a, b) =>
        this.groupRank(a.label, mode) - this.groupRank(b.label, mode) ||
        a.label.localeCompare(b.label),
    );
  });

  /**
   * Peso de ordenación de un grupo. Por área sigue AREA_ORDER (Backend primero,
   * que es el perfil que se quiere destacar); por emisor todo empata y decide
   * el alfabético, salvo "Other", que siempre cierra.
   */
  private groupRank(label: string, mode: GroupMode): number {
    if (label === NO_ISSUER) return Number.MAX_SAFE_INTEGER;
    if (mode !== 'area') return 0;
    const index = AREA_ORDER.indexOf(label as SkillArea);
    return index === -1 ? AREA_ORDER.length : index;
  }

  protected setMode(mode: GroupMode) {
    this.mode.set(mode);
  }

  /** 'YYYY-MM' -> 'Jan 2024'. Se formatea en vez de guardarse ya escrito. */
  protected formatIssued(issued: string): string {
    const [year, month] = issued.split('-').map(Number);
    if (!year || !month) return issued;
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
}
