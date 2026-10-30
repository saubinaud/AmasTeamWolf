# 🔧 Configuración de Google para AMAS Team Wolf

## 📋 Pasos para Configurar Google Search Console

### 1. **Crear Cuenta en Google Search Console**
1. Ve a: https://search.google.com/search-console
2. Haz clic en "Comenzar ahora"
3. Inicia sesión con tu cuenta de Google

### 2. **Agregar la Propiedad**
1. Haz clic en "Agregar propiedad"
2. Selecciona "Prefijo de URL"
3. Ingresa: `https://amasteamwolf.com`
4. Haz clic en "Continuar"

### 3. **Verificar la Propiedad**

Opción A - **Meta Tag HTML** (Recomendado):
1. Google te dará un código como: `<meta name="google-site-verification" content="ABC123...">`
2. Copia el contenido del tag
3. Agrega este código en `/components/SEO.tsx` dentro del useEffect:

```typescript
// Dentro de updateMetaTag calls
updateMetaTag('google-site-verification', 'TU_CODIGO_AQUI');
```

Opción B - **Archivo HTML**:
1. Descarga el archivo HTML que Google te proporciona
2. Súbelo a `/public/` de tu proyecto
3. Haz clic en "Verificar" en Google Search Console

### 4. **Enviar el Sitemap**
1. Una vez verificado, ve a "Sitemaps" en el menú lateral
2. Ingresa: `sitemap.xml`
3. Haz clic en "Enviar"

---

## 📊 Configurar Google Analytics 4

### 1. **Crear Cuenta**
1. Ve a: https://analytics.google.com
2. Haz clic en "Comenzar a medir"
3. Crea una cuenta con el nombre "AMAS Team Wolf"

### 2. **Configurar Propiedad**
1. Nombre de la propiedad: "AMAS Team Wolf - Web"
2. Zona horaria: "Perú (GMT-5)"
3. Moneda: "Sol peruano (PEN)"

### 3. **Obtener el ID de Medición**
1. Completa el asistente de configuración
2. Copia tu ID de medición (formato: `G-XXXXXXXXXX`)

### 4. **Implementar en el Sitio**

En `/App.tsx`, agrega:

```typescript
import { Analytics } from './components/Analytics';

function App() {
  return (
    <>
      <Analytics trackingId="G-TU-ID-AQUI" />
      {/* resto del código */}
    </>
  );
}
```

### 5. **Configurar Eventos Personalizados**

Ya están disponibles estos eventos:
- ✅ `trackEnrollment()` - Cuando alguien se matricula
- ✅ `trackPurchase()` - Cuando alguien compra en la tienda
- ✅ `trackAddToCart()` - Cuando agregan al carrito

Ejemplo de uso en formularios de registro:

```typescript
import { useAnalytics } from './components/Analytics';

function RegistroComponent() {
  const { trackEnrollment } = useAnalytics();
  
  const handleSubmit = async () => {
    // Tu lógica de envío...
    
    // Trackear el evento
    trackEnrollment('Programa 3 Meses', 869);
  };
}
```

---

## 🏢 Configurar Google My Business

### 1. **Crear Perfil de Empresa**
1. Ve a: https://www.google.com/business/
2. Haz clic en "Administrar ahora"
3. Inicia sesión con tu cuenta de Google

### 2. **Agregar Información**

**Nombre del negocio**: AMAS Team Wolf

**Categoría**: 
- Academia de artes marciales
- Centro de taekwondo
- Academia deportiva

**Ubicación**: Av. San Luis 2083, San Borja, Lima, Perú

**Área de servicio**: San Borja, Surco, La Molina, Miraflores

**Teléfono**: +51 989 717 412

**Sitio web**: https://amasteamwolf.com

**Horarios**:
- Lunes a Viernes: 15:00 - 20:30
- Sábados: 09:00 - 13:00
- Domingos: Cerrado

### 3. **Verificación**
Google enviará un código de verificación por:
- Tarjeta postal (más común)
- Llamada telefónica
- Email (si está disponible)

### 4. **Optimizar el Perfil**

**Fotos a subir**:
- ✅ Logo de AMAS Team Wolf
- ✅ Fotos del dojo/academia (mínimo 5)
- ✅ Fotos de estudiantes en acción (con autorización)
- ✅ Fotos de instructores
- ✅ Fotos de graduaciones
- ✅ Video tour virtual (opcional pero muy efectivo)

**Descripción**:
```
AMAS Team Wolf es una academia líder en artes marciales ubicada en San Borja, Lima. 
Ofrecemos programas de Taekwondo, Leadership Wolf, Combat, Bo Staff y Nunchaku para 
niños y jóvenes. Formamos líderes con disciplina, respeto y valores. Contamos con 
instructores certificados y programas diseñados para el desarrollo integral. 
¡Matrícula abierta todo el año!

Programas destacados:
🥋 Programa Full 3 Meses
🐺 Leadership Wolf
🥊 Combat Training
🏅 Graduaciones oficiales con certificado

¡Primera clase gratis! Contáctanos al +51 989 717 412
```

**Atributos importantes**:
- ✅ Accesible para sillas de ruedas
- ✅ Estacionamiento disponible
- ✅ Wi-Fi gratuito
- ✅ Apto para niños
- ✅ Adecuado para grupos

### 5. **Publicaciones Regulares**

Publica al menos 1 vez por semana:
- 📢 Anuncios de nuevos programas
- 🏆 Logros de estudiantes
- 📸 Fotos de graduaciones
- 💡 Tips de artes marciales
- 🎉 Ofertas especiales

---

## 🔍 Verificar que Todo Funciona

### Tests a Realizar:

1. **Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Ingresa: `https://amasteamwolf.com`
   - Verifica que detecte: Organization, LocalBusiness, Course

2. **Mobile-Friendly Test**
   - URL: https://search.google.com/test/mobile-friendly
   - Ingresa: `https://amasteamwolf.com`
   - Debe decir: "La página es compatible con dispositivos móviles"

3. **PageSpeed Insights**
   - URL: https://pagespeed.web.dev/
   - Ingresa: `https://amasteamwolf.com`
   - Objetivo: >90 en móvil y desktop

4. **Schema Markup Validator**
   - URL: https://validator.schema.org/
   - Ingresa: `https://amasteamwolf.com`
   - Verifica que no haya errores en el JSON-LD

---

## 📈 Métricas a Monitorear

### En Google Search Console:
- 📊 Impresiones (cuántas veces apareció en búsquedas)
- 👆 Clics (cuántas veces hicieron clic)
- 📈 CTR (Click Through Rate - porcentaje de clics)
- 📍 Posición promedio en búsquedas

### En Google Analytics:
- 👥 Usuarios nuevos vs recurrentes
- ⏱️ Tiempo promedio en el sitio
- 📱 Dispositivos (móvil vs desktop)
- 🌍 Ubicaciones geográficas
- 📄 Páginas más visitadas
- 🎯 Conversiones (matrículas, compras)

### En Google My Business:
- 👀 Visualizaciones del perfil
- 🔍 Búsquedas (directas vs descubrimiento)
- 📞 Llamadas desde Google
- 🗺️ Solicitudes de direcciones
- 🖼️ Visualizaciones de fotos

---

## 🎯 Keywords a Monitorear

Prioridad Alta:
- AMAS Team Wolf
- Leadership Wolf
- artes marciales San Borja
- taekwondo Lima
- academia artes marciales Perú

Prioridad Media:
- clases taekwondo niños
- leadership program Lima
- combat training Perú
- bo staff Lima
- defensa personal niños

Long-tail Keywords:
- "academia de artes marciales en San Borja para niños"
- "programa leadership wolf AMAS"
- "clases de taekwondo cerca de mí"
- "mejor academia de artes marciales Lima"

---

## ⚠️ Errores Comunes a Evitar

1. ❌ **No verificar la propiedad** en Google Search Console
2. ❌ **No enviar el sitemap** después de verificar
3. ❌ **Inconsistencia en NAP** (nombre, dirección, teléfono)
4. ❌ **No pedir reseñas** a clientes satisfechos
5. ❌ **No actualizar Google My Business** regularmente
6. ❌ **Tener perfil incompleto** en Google My Business
7. ❌ **No responder a reseñas** (tanto positivas como negativas)
8. ❌ **No añadir fotos** nuevas regularmente

---

## ✅ Checklist de Configuración

### Google Search Console
- [ ] Cuenta creada
- [ ] Propiedad agregada
- [ ] Propiedad verificada
- [ ] Sitemap enviado
- [ ] Sin errores de rastreo
- [ ] Datos estructurados validados

### Google Analytics
- [ ] Cuenta creada
- [ ] Propiedad configurada
- [ ] ID de medición obtenido
- [ ] Código implementado en el sitio
- [ ] Eventos personalizados configurados
- [ ] Objetivos de conversión definidos

### Google My Business
- [ ] Perfil creado
- [ ] Información completa
- [ ] Verificado
- [ ] Fotos subidas (mínimo 10)
- [ ] Descripción optimizada
- [ ] Horarios actualizados
- [ ] Primera publicación realizada

---

## 📞 Soporte

Si tienes problemas con la configuración:

1. **Documentación oficial**:
   - Search Console: https://support.google.com/webmasters
   - Analytics: https://support.google.com/analytics
   - My Business: https://support.google.com/business

2. **Comunidad**:
   - Foros de Google Webmasters
   - Stack Overflow (tag: google-search-console)

---

## 🎓 Recursos de Aprendizaje

- **Google SEO Starter Guide**: https://developers.google.com/search/docs/beginner/seo-starter-guide
- **Google Analytics Academy**: https://analytics.google.com/analytics/academy/
- **YouTube Google Search Central**: Canal oficial de Google para webmasters

---

**¡Buena suerte con la configuración!** 🚀

Recuerda: El SEO es un maratón, no un sprint. Los resultados se verán en 2-3 meses de trabajo constante.
