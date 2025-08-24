/**
 * Modal pentru configurarea pas cu pas a permisiunilor background location
 * Ghidează utilizatorul prin procesul complet de setup
 */

import React, { useState, useEffect } from 'react';
import { backgroundPermissionsService, PermissionState, BackgroundLocationSetupSteps } from '../services/backgroundPermissions';

interface BackgroundPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (success: boolean) => void;
  showInitialPrompt?: boolean;
}

const BackgroundPermissionsModal: React.FC<BackgroundPermissionsModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  showInitialPrompt = true
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<BackgroundLocationSetupSteps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [showExplanation, setShowExplanation] = useState(showInitialPrompt);
  const [setupResult, setSetupResult] = useState<{ success: boolean; completedSteps: number; totalSteps: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializePermissions();
    }
  }, [isOpen]);

  const initializePermissions = async () => {
    setIsLoading(true);
    try {
      await backgroundPermissionsService.initialize();
      const state = await backgroundPermissionsService.checkAllPermissions();
      const setupSteps = backgroundPermissionsService.getSetupSteps();
      
      setPermissionState(state);
      setSteps(setupSteps);
      
      // Găsește primul step necompletat
      const nextStep = setupSteps.findIndex(step => !step.isCompleted);
      setCurrentStep(nextStep >= 0 ? nextStep : 0);
      
    } catch (error) {
      console.error('❌ Eroare inițializare permisiuni:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSetup = async () => {
    setIsLoading(true);
    try {
      const result = await backgroundPermissionsService.performCompleteSetup();
      setSetupResult(result);
      
      // Actualizează starea după setup
      const newState = await backgroundPermissionsService.checkAllPermissions();
      setPermissionState(newState);
      
      // Actualizează steps-urile
      const updatedSteps = backgroundPermissionsService.getSetupSteps();
      setSteps(updatedSteps);
      
    } catch (error) {
      console.error('❌ Eroare setup permisiuni:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    const isFullyConfigured = backgroundPermissionsService.isFullyConfigured();
    onComplete(isFullyConfigured);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">
              🔐 Configurare Background Location
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isLoading}
            ></button>
          </div>
          
          <div className="modal-body">
            {isLoading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Se încarcă...</span>
                </div>
                <p className="mt-3">Verific configurația actuală...</p>
              </div>
            )}

            {/* Explicația inițială */}
            {showExplanation && !isLoading && (
              <div className="mb-4">
                <div className="alert alert-info">
                  <h6 className="alert-heading">📱 De ce sunt necesare aceste permisiuni?</h6>
                  <p className="mb-2">{backgroundPermissionsService.getComplianceMessage()}</p>
                </div>
                
                {permissionState?.deviceInfo && (
                  <div className="small text-muted mb-3">
                    <strong>Dispozitiv:</strong> {permissionState.deviceInfo.manufacturer} {permissionState.deviceInfo.model}<br/>
                    <strong>Android:</strong> {permissionState.deviceInfo.osVersion}
                  </div>
                )}
                
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowExplanation(false)}
                  >
                    Înțeleg - Configurează Permisiunile
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={onClose}
                  >
                    Amână pentru mai târziu
                  </button>
                </div>
              </div>
            )}

            {/* Steps de configurare */}
            {!showExplanation && !isLoading && steps.length > 0 && (
              <div>
                <div className="mb-4">
                  <h6>📋 Pașii de configurare:</h6>
                  {steps.map((step, index) => (
                    <div key={step.step} className={`d-flex align-items-center mb-3 p-3 rounded ${
                      step.isCompleted ? 'bg-success bg-opacity-25 border border-success' :
                      index === currentStep ? 'bg-primary bg-opacity-25 border border-primary' :
                      'bg-secondary bg-opacity-25'
                    }`}>
                      <div className="me-3">
                        {step.isCompleted ? (
                          <i className="bi bi-check-circle-fill text-success fs-4"></i>
                        ) : index === currentStep ? (
                          <i className="bi bi-arrow-right-circle text-primary fs-4"></i>
                        ) : (
                          <i className="bi bi-circle text-secondary fs-4"></i>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{step.title}</h6>
                        <p className="mb-0 small">{step.description}</p>
                      </div>
                      {step.isRequired && (
                        <span className="badge bg-warning text-dark">Obligatoriu</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status actual */}
                {permissionState && (
                  <div className="mb-4">
                    <h6>📊 Status actual:</h6>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <div className={`p-2 rounded text-center ${
                          permissionState.location.location === 'granted' ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'
                        }`}>
                          <small>📍 Localizare</small><br/>
                          <strong>{permissionState.location.location === 'granted' ? '✅ Acordată' : '❌ Lipsește'}</strong>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className={`p-2 rounded text-center ${
                          permissionState.backgroundLocation === 'granted' ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'
                        }`}>
                          <small>🌅 Background</small><br/>
                          <strong>{permissionState.backgroundLocation === 'granted' ? '✅ Acordată' : '❌ Lipsește'}</strong>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className={`p-2 rounded text-center ${
                          permissionState.batteryOptimization === 'whitelisted' ? 'bg-success bg-opacity-25' : 'bg-warning bg-opacity-25'
                        }`}>
                          <small>🔋 Baterie</small><br/>
                          <strong>{permissionState.batteryOptimization === 'whitelisted' ? '✅ Optimizată' : '⚠️ Needs Setup'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rezultatul setup-ului */}
                {setupResult && (
                  <div className={`alert ${setupResult.success ? 'alert-success' : 'alert-warning'} mb-4`}>
                    <h6 className="alert-heading">
                      {setupResult.success ? '🎉 Configurare completă!' : '⚠️ Configurare parțială'}
                    </h6>
                    <p className="mb-0">
                      {setupResult.completedSteps} din {setupResult.totalSteps} pași completați cu succes.
                      {!setupResult.success && ' Te rog să completezi pașii rămași manual din Setările dispozitivului.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer border-secondary">
            {showExplanation ? null : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Închide
                </button>
                
                {!setupResult && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={executeSetup}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Configurez...
                      </>
                    ) : (
                      'Configurează Automat'
                    )}
                  </button>
                )}
                
                {setupResult && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleComplete}
                  >
                    {setupResult.success ? 'Completat!' : 'Continuă cu setup-ul parțial'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundPermissionsModal;