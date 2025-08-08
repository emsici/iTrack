import React, { useState } from 'react';
import './ClientPresentation.css';

interface Slide {
  id: number;
  title: string;
  content: React.ReactNode;
  background?: string;
}

const ClientPresentation: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      title: "iTrack GPS",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      content: (
        <div className="title-slide">
          <div className="logo-section">
            <i className="fas fa-satellite-dish" style={{ fontSize: '80px', color: 'white', marginBottom: '20px' }}></i>
            <h1>iTrack GPS</h1>
            <p className="subtitle">Soluția Completă pentru Monitorizarea Flotei</p>
          </div>
          <div className="company-info">
            <p>Sisteme GPS Profesionale pentru Transport</p>
            <p>România • 2025</p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Ce este iTrack?",
      content: (
        <div className="content-slide">
          <h2>Ce este iTrack GPS?</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <i className="fas fa-map-marked-alt"></i>
              <h3>Monitorizare în Timp Real</h3>
              <p>Urmărire GPS precisă la fiecare 5 secunde pentru toate vehiculele din flotă</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-route"></i>
              <h3>Gestionare Curse</h3>
              <p>Control complet asupra curselor: start, stop, pauză individual pentru fiecare vehicul</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-wifi"></i>
              <h3>Funcționare Offline</h3>
              <p>Aplicația salvează datele chiar și fără internet, sincronizare automată</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-chart-line"></i>
              <h3>Rapoarte Complete</h3>
              <p>Statistici detaliate, trasee, timpi de lucru și export pentru contabilitate</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Beneficii Principale",
      content: (
        <div className="content-slide">
          <h2>Beneficii pentru Compania Ta</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <div className="benefit-icon success">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="benefit-content">
                <h3>Reducerea Costurilor cu 15-20%</h3>
                <p>Optimizarea rutelor și reducerea consumului de combustibil</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon info">
                <i className="fas fa-clock"></i>
              </div>
              <div className="benefit-content">
                <h3>Creșterea Eficienței cu 25%</h3>
                <p>Eliminarea timpilor morți și optimizarea planificării</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon warning">
                <i className="fas fa-users"></i>
              </div>
              <div className="benefit-content">
                <h3>Satisfacția Clienților +40%</h3>
                <p>Informare în timp real și livrări precise la timp</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon primary">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="benefit-content">
                <h3>Securitate și Control Total</h3>
                <p>Vizibilitate completă asupra întregii flote 24/7</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Cum Funcționează",
      content: (
        <div className="content-slide">
          <h2>Simplu pentru Șoferi, Puternic pentru Manageri</h2>
          <div className="workflow-section">
            <div className="workflow-column">
              <h3><i className="fas fa-user"></i> Pentru Șoferi</h3>
              <div className="workflow-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <p>Login cu credentialele companiei</p>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <p>Introduce numărul vehiculului</p>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <p>Selectează cursa și apasă "Start"</p>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <p>GPS transmite automat poziția</p>
                </div>
                <div className="step">
                  <span className="step-number">5</span>
                  <p>La final apasă "Stop"</p>
                </div>
              </div>
            </div>
            <div className="workflow-column">
              <h3><i className="fas fa-user-tie"></i> Pentru Manageri</h3>
              <div className="workflow-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <p>Urmărire în timp real a tuturor vehiculelor</p>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <p>Rapoarte complete cu trasee și timpi</p>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <p>Alerte pentru probleme sau întârzieri</p>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <p>Statistici pentru optimizarea rutelor</p>
                </div>
                <div className="step">
                  <span className="step-number">5</span>
                  <p>Export date pentru contabilitate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "ROI și Economii",
      content: (
        <div className="content-slide">
          <h2>Return on Investment</h2>
          <div className="roi-grid">
            <div className="roi-card">
              <div className="roi-icon">
                <i className="fas fa-gas-pump"></i>
              </div>
              <h3>Economii Combustibil</h3>
              <div className="roi-value">15-20%</div>
              <p>Reducere prin optimizarea rutelor</p>
            </div>
            <div className="roi-card">
              <div className="roi-icon">
                <i className="fas fa-stopwatch"></i>
              </div>
              <h3>Eficiență Operațională</h3>
              <div className="roi-value">25%</div>
              <p>Creștere prin eliminarea timpilor morți</p>
            </div>
            <div className="roi-card">
              <div className="roi-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h3>Recuperare Investiție</h3>
              <div className="roi-value">2-3 Luni</div>
              <p>ROI rapid prin economiile generate</p>
            </div>
          </div>
          <div className="example-calculation">
            <h3>Exemplu Companie cu 10 Vehicule:</h3>
            <div className="calculation-row">
              <span>Cost combustibil lunar:</span>
              <span>15.000 RON</span>
            </div>
            <div className="calculation-row success">
              <span>Economie cu iTrack (15%):</span>
              <span>2.250 RON/lună</span>
            </div>
            <div className="calculation-row primary">
              <span>Economie anuală:</span>
              <span><strong>27.000 RON</strong></span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "De Ce iTrack?",
      content: (
        <div className="content-slide">
          <h2>De Ce să Alegeți iTrack GPS?</h2>
          <div className="advantages-grid">
            <div className="advantage-card">
              <i className="fas fa-flag"></i>
              <h3>Dezvoltat în România</h3>
              <ul>
                <li>Suport tehnic în română</li>
                <li>Înțelegerea pieței locale</li>
                <li>Adaptare la legislația română</li>
              </ul>
            </div>
            <div className="advantage-card">
              <i className="fas fa-rocket"></i>
              <h3>Tehnologie Avansată</h3>
              <ul>
                <li>Cel mai precis GPS (5 secunde)</li>
                <li>Funcționare garantată offline</li>
                <li>Interface modernă și intuitivă</li>
              </ul>
            </div>
            <div className="advantage-card">
              <i className="fas fa-headset"></i>
              <h3>Suport Complet</h3>
              <ul>
                <li>Instruire gratuită pentru șoferi</li>
                <li>Asistență tehnică 24/7</li>
                <li>Actualizări regulate gratuite</li>
              </ul>
            </div>
            <div className="advantage-card">
              <i className="fas fa-expand-arrows-alt"></i>
              <h3>Flexibilitate Totală</h3>
              <ul>
                <li>Adaptare la orice tip de transport</li>
                <li>Scalabil pentru orice flotă</li>
                <li>Integrare cu sisteme existente</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Implementare",
      content: (
        <div className="content-slide">
          <h2>Proces de Implementare Simplu</h2>
          <div className="implementation-timeline">
            <div className="timeline-step">
              <div className="timeline-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <div className="timeline-content">
                <h3>Consultanță Gratuită</h3>
                <p>Analizăm nevoile companiei și prezentăm soluția optimă</p>
                <span className="timeline-duration">1 zi</span>
              </div>
            </div>
            <div className="timeline-step">
              <div className="timeline-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <div className="timeline-content">
                <h3>Configurare Sistem</h3>
                <p>Adaptăm aplicația la flota și procesele dumneavoastră</p>
                <span className="timeline-duration">2-3 zile</span>
              </div>
            </div>
            <div className="timeline-step">
              <div className="timeline-icon">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="timeline-content">
                <h3>Instruire Echipă</h3>
                <p>Pregătim șoferii și managerii pentru utilizarea optimă</p>
                <span className="timeline-duration">1 zi</span>
              </div>
            </div>
            <div className="timeline-step">
              <div className="timeline-icon">
                <i className="fas fa-play-circle"></i>
              </div>
              <div className="timeline-content">
                <h3>Go-Live</h3>
                <p>Lansare cu suport complet și monitorizare performanță</p>
                <span className="timeline-duration">Continuu</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: "Contact",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      content: (
        <div className="contact-slide">
          <h2>Să Începem Împreună!</h2>
          <div className="contact-info">
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <div>
                <h3>Telefon</h3>
                <p>[Numărul de telefon]</p>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <div>
                <h3>Email</h3>
                <p>contact@itrack-gps.ro</p>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-globe"></i>
              <div>
                <h3>Website</h3>
                <p>www.itrack-gps.ro</p>
              </div>
            </div>
          </div>
          <div className="cta-section">
            <h3>Demonstrație Gratuită</h3>
            <p>Vedeți iTrack în acțiune cu propriile dumneavoastră vehicule</p>
            <div className="cta-benefits">
              <span>✓ Fără obligații</span>
              <span>✓ Test complet 7 zile</span>
              <span>✓ Suport dedicat</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="presentation-container">
      <div 
        className="slide" 
        style={{ 
          background: slides[currentSlide].background || 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        {slides[currentSlide].content}
      </div>
      
      <div className="presentation-controls">
        <button onClick={prevSlide} disabled={currentSlide === 0}>
          <i className="fas fa-chevron-left"></i>
        </button>
        
        <div className="slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        
        <button onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      
      <div className="slide-counter">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

export default ClientPresentation;