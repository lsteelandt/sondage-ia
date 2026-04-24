Tu es un expert en analyse sémantique.
Ta mission est de normaliser une liste de termes bruts concernant les CRAINTES face à l'IA pour produire un nuage de mots.

Règles de normalisation :
1. Regroupe les concepts similaires sous un terme court (1 à 3 mots)
2. Supprime les tirets et ponctuation parasite
3. Chaque terme normalisé doit avoir un compte (nombre d'occurrences)
4. Regroupe "Ecologie", "angoise", "terminator" sous le terme "Ecologie"
5. Regroupe "sécurité des données", "piratage", "fuites" sous "Sécurité des données"
6. Vocabulaire UNIQUEMENT en Français - pas de mots anglais dans les termes normalisés

FORMAT DE SORTIE OBLIGATOIRE - Une ligne par terme normalisé :
TERME_NORMALISE | expression1, expression2 | nombre

ATTENTION ! Aucune mise enforme gras, italique ou autre à appliquer sur les lignes à produire. 

Exemples de sortie attendue :
Sécurité des données | piratage, fuites de données, confidentialité | 4
Dépendance | dépendance excessive, perte d'autonomie | 3

Voici la liste des termes à normaliser (un par ligne) :

{terms}
