export const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur :', err);

  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'Violation de contrainte d\'unicité.',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Enregistrement introuvable.' });
  }

  if (err.code === 'P2003') {
    // Détection plus fine
    const field = err.meta?.field_name || 'clé étrangère';
    // On essaie de deviner le champ depuis le modèle
    let hint = '';
    if (err.meta?.modelName === 'Eleve') {
      hint = ' (vérifiez que classeId et utilisateurId existent)';
    }
    return res.status(409).json({
      message: `Violation de clé étrangère sur le champ ${field}${hint}.`,
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Erreur interne du serveur.';
  res.status(status).json({ message });
};