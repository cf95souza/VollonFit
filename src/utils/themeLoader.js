import { supabase } from '../supabaseClient';
import { hexToRgbString } from './colorUtils';

export const applyTheme = (colorHex) => {
  if (!colorHex) return;
  const rgb = hexToRgbString(colorHex);
  document.documentElement.style.setProperty('--color-primary', rgb);
  localStorage.setItem('vollonfit_theme_color', colorHex);
};

export const loadTheme = async (teacherId) => {
  if (!teacherId) return;
  
  // 1. Tentar carregar do cache para ser instantâneo
  const cachedColor = localStorage.getItem('vollonfit_theme_color');
  if (cachedColor) {
    applyTheme(cachedColor);
  }

  // 2. Buscar do banco para garantir que está atualizado
  try {
    const { data } = await supabase
      .from('gym_settings')
      .select('value')
      .eq('key', `theme_${teacherId}`)
      .maybeSingle();
    
    if (data?.value) {
      applyTheme(data.value);
    }
  } catch (e) {
    console.error("Erro ao carregar tema:", e);
  }
};
