import { supabase } from '../supabaseClient';
import { hexToRgbString } from './colorUtils';

export const applyTheme = (colorHex) => {
  const defaultColor = '#E11D2E'; // Vermelho VollonFit oficial
  const colorToApply = colorHex || defaultColor;
  
  const rgb = hexToRgbString(colorToApply);
  document.documentElement.style.setProperty('--color-primary', rgb);
  localStorage.setItem('vollonfit_theme_color', colorToApply);
};

export const loadTheme = async (teacherId) => {
  if (!teacherId) {
    applyTheme('#E11D2E');
    return;
  }
  
  // 1. Tentar carregar do cache para ser instantâneo
  const cachedColor = localStorage.getItem('vollonfit_theme_color');
  if (cachedColor) {
    applyTheme(cachedColor);
  } else {
    applyTheme('#E11D2E');
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
