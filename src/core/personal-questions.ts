/**
 * Back2IQ DynPass - Curated Biographical Personal Questions Pool (Highest Security Tier)
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 *
 * Provides personal biographical memory triggers where users extract boundary characters
 * (First and/or Last) from answers only existing in their personal memory.
 */

import { SupportedLocale, PersonalQuestionItem } from '../types.js';

export const PERSONAL_QUESTIONS_POOL: PersonalQuestionItem[] = [
  {
    id: 'pq_partner',
    category: 'relationships',
    question: {
      de: 'Vorname deines ersten Beziehungspartners?',
      en: 'First name of your first romantic partner?',
      tr: 'İlk romantik partnerinizin ilk adı?',
      fr: 'Prénom de votre premier(ère) partenaire ?',
      es: '¿Nombre de pila de tu primera pareja sentimental?',
    },
    exampleAnswer: { de: 'Laura', en: 'Sarah', tr: 'Elif', fr: 'Camille', es: 'Sofia' },
  },
  {
    id: 'pq_elementary',
    category: 'childhood',
    question: {
      de: 'Name deiner Grundschule?',
      en: 'Name of your elementary/primary school?',
      tr: 'Gittiğiniz ilkokulun adı?',
      fr: 'Nom de votre école primaire ?',
      es: '¿Nombre de tu escuela primaria?',
    },
    exampleAnswer: { de: 'Goethe', en: 'Lincoln', tr: 'Ataturk', fr: 'Pasteur', es: 'Cervantes' },
  },
  {
    id: 'pq_first_pet',
    category: 'childhood',
    question: {
      de: 'Name deines ersten Haustiers?',
      en: 'Name of your first pet?',
      tr: 'İlk evcil hayvanınızın adı?',
      fr: 'Nom de votre premier animal de compagnie ?',
      es: '¿Nombre de tu primera mascota?',
    },
    exampleAnswer: { de: 'Bello', en: 'Buddy', tr: 'Karabas', fr: 'Filou', es: 'Toby' },
  },
  {
    id: 'pq_first_car',
    category: 'milestones',
    question: {
      de: 'Marke deines ersten eigenen Autos?',
      en: 'Make/brand of your first car?',
      tr: 'Sahip olduğunuz ilk araba markası?',
      fr: 'Marque de votre première voiture ?',
      es: '¿Marca de tu primer coche?',
    },
    exampleAnswer: { de: 'Golf', en: 'Civic', tr: 'Toyota', fr: 'Clio', es: 'Ibiza' },
  },
  {
    id: 'pq_birth_hospital',
    category: 'childhood',
    question: {
      de: 'Name des Krankenhauses, in dem du geboren wurdest?',
      en: 'Name of the hospital where you were born?',
      tr: 'Doğduğunuz hastanenin adı?',
      fr: 'Nom de l’hôpital où vous êtes né(e) ?',
      es: '¿Nombre del hospital en el que naciste?',
    },
    exampleAnswer: { de: 'Marien', en: 'Mercy', tr: 'Devlet', fr: 'Chopin', es: 'Sanitas' },
  },
  {
    id: 'pq_childhood_street',
    category: 'childhood',
    question: {
      de: 'Straße, in der du als Kind aufgewachsen bist?',
      en: 'Street name where you grew up as a child?',
      tr: 'Çocukken büyüdüğünüz sokak veya cadde adı?',
      fr: 'Rue dans laquelle vous avez grandi ?',
      es: '¿Calle en la que creciste de niño?',
    },
    exampleAnswer: { de: 'Haupt', en: 'Maple', tr: 'Ataturk', fr: 'Moliere', es: 'Mayor' },
  },
  {
    id: 'pq_first_job_company',
    category: 'milestones',
    question: {
      de: 'Name deines allerersten Arbeitgebers / Unternehmens?',
      en: 'Name of your very first employer / company?',
      tr: 'İlk işvereninizin / şirketinizin adı?',
      fr: 'Nom de votre tout premier employeur ?',
      es: '¿Nombre de tu primer empleador o empresa?',
    },
    exampleAnswer: { de: 'Siemens', en: 'Oracle', tr: 'Turkcell', fr: 'Renault', es: 'Telefonica' },
  },
  {
    id: 'pq_first_concert',
    category: 'favorites',
    question: {
      de: 'Band / Künstler deines ersten Live-Konzerts?',
      en: 'Band / artist of the first live concert you attended?',
      tr: 'Gittiğiniz ilk canlı konserdeki grup / sanatçı?',
      fr: 'Groupe / artiste de votre premier concert live ?',
      es: '¿Banda o artista de tu primer concierto en vivo?',
    },
    exampleAnswer: { de: 'Queen', en: 'Coldplay', tr: 'Tarkan', fr: 'Daftpunk', es: 'Estopa' },
  },
  {
    id: 'pq_favorite_childhood_dish',
    category: 'childhood',
    question: {
      de: 'Dein absolutes Lieblingsgericht in der Kindheit?',
      en: 'Your absolute favorite meal during childhood?',
      tr: 'Çocukluğunuzdaki en sevdiğiniz yemek?',
      fr: 'Votre plat préféré pendant votre enfance ?',
      es: '¿Tu comida favorita en la infancia?',
    },
    exampleAnswer: { de: 'Pizza', en: 'Pancakes', tr: 'Manti', fr: 'Crepes', es: 'Paella' },
  },
  {
    id: 'pq_mothers_maiden_city',
    category: 'childhood',
    question: {
      de: 'Geburtsstadt deiner Mutter?',
      en: 'Birth city of your mother?',
      tr: 'Annenizin doğum şehri?',
      fr: 'Ville de naissance de votre mère ?',
      es: '¿Ciudad de nacimiento de tu madre?',
    },
    exampleAnswer: { de: 'Hamburg', en: 'Chicago', tr: 'Izmir', fr: 'Lyon', es: 'Sevilla' },
  },
  {
    id: 'pq_first_flight_dest',
    category: 'milestones',
    question: {
      de: 'Zielort deines ersten Fluges?',
      en: 'Destination city of your first flight?',
      tr: 'İlk uçak yolculuğunuzun varış şehri?',
      fr: 'Destination de votre premier vol en avion ?',
      es: '¿Ciudad de destino de tu primer vuelo?',
    },
    exampleAnswer: { de: 'Palma', en: 'London', tr: 'Antalya', fr: 'Nice', es: 'Roma' },
  },
  {
    id: 'pq_childhood_best_friend',
    category: 'childhood',
    question: {
      de: 'Vorname deines besten Freundes aus der Kindheit?',
      en: 'First name of your childhood best friend?',
      tr: 'Çocukluktaki en iyi arkadaşınızın ilk adı?',
      fr: 'Prénom de votre meilleur(e) ami(e) d’enfance ?',
      es: '¿Nombre de tu mejor amigo(a) de la infancia?',
    },
    exampleAnswer: { de: 'Felix', en: 'James', tr: 'Ahmet', fr: 'Julien', es: 'Carlos' },
  },
  {
    id: 'pq_highschool_mascot',
    category: 'childhood',
    question: {
      de: 'Lieblingsfach in der Oberstufe/Gymnasium?',
      en: 'Favorite subject in high school?',
      tr: 'Lisedeki en sevdiğiniz ders?',
      fr: 'Matière préférée au lycée ?',
      es: '¿Asignatura favorita en la escuela secundaria?',
    },
    exampleAnswer: { de: 'Physik', en: 'History', tr: 'Tarih', fr: 'Chimie', es: 'Fisica' },
  },
  {
    id: 'pq_first_phone_model',
    category: 'milestones',
    question: {
      de: 'Hersteller deines ersten eigenen Handys?',
      en: 'Manufacturer of your first mobile phone?',
      tr: 'İlk cep telefonunuzun markası?',
      fr: 'Marque de votre tout premier téléphone portable ?',
      es: '¿Marca de tu primer teléfono móvil?',
    },
    exampleAnswer: { de: 'Nokia', en: 'Motorola', tr: 'Ericsson', fr: 'Alcatel', es: 'Siemens' },
  },
  {
    id: 'pq_favorite_holiday_spot',
    category: 'favorites',
    question: {
      de: 'Dein persönlicher Sehnsuchtsort / Lieblingsurlaubsziel?',
      en: 'Your favorite dream vacation destination?',
      tr: 'En sevdiğiniz rüya tatil yeri?',
      fr: 'Votre lieu de vacances de rêve préféré ?',
      es: '¿Tu destino de vacaciones favorito?',
    },
    exampleAnswer: { de: 'Alpen', en: 'Hawaii', tr: 'Bodrum', fr: 'Biarritz', es: 'Canarias' },
  },
  {
    id: 'pq_first_apartment_city',
    category: 'milestones',
    question: {
      de: 'Stadt deiner ersten eigenen Wohnung?',
      en: 'City of your first independent apartment?',
      tr: 'İlk bağımsız evinizin bulunduğu şehir?',
      fr: 'Ville de votre premier appartement indépendant ?',
      es: '¿Ciudad de tu primer apartamento independiente?',
    },
    exampleAnswer: { de: 'Berlin', en: 'Boston', tr: 'Ankara', fr: 'Paris', es: 'Madrid' },
  },
  {
    id: 'pq_grandmothers_name',
    category: 'relationships',
    question: {
      de: 'Vorname deiner Großmutter mütterlicherseits?',
      en: 'First name of your maternal grandmother?',
      tr: 'Anneannenizin ilk adı?',
      fr: 'Prénom de votre grand-mère maternelle ?',
      es: '¿Nombre de pila de tu abuela materna?',
    },
    exampleAnswer: { de: 'Helga', en: 'Emma', tr: 'Fatma', fr: 'Jeanne', es: 'Carmen' },
  },
  {
    id: 'pq_dream_profession',
    category: 'childhood',
    question: {
      de: 'Dein Traumberuf als 7-jähriges Kind?',
      en: 'Your dream job when you were 7 years old?',
      tr: '7 yaşındayken hayalini kurduğunuz meslek?',
      fr: 'Votre métier de rêve quand vous aviez 7 ans ?',
      es: '¿Tu profesión soñada cuando tenías 7 años?',
    },
    exampleAnswer: { de: 'Pilot', en: 'Astronaut', tr: 'Kaptan', fr: 'Pompier', es: 'Medico' },
  },
];

export function getPersonalQuestionById(id: string): PersonalQuestionItem | undefined {
  return PERSONAL_QUESTIONS_POOL.find((q) => q.id === id);
}

export function getPersonalQuestionForIndex(index: number): PersonalQuestionItem {
  const normalizedIndex = Math.abs(index - 1) % PERSONAL_QUESTIONS_POOL.length;
  return PERSONAL_QUESTIONS_POOL[normalizedIndex];
}

export function getRandomPersonalQuestion(): PersonalQuestionItem {
  const idx = Math.floor(Math.random() * PERSONAL_QUESTIONS_POOL.length);
  return PERSONAL_QUESTIONS_POOL[idx];
}
