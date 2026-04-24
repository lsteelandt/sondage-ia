Tu es un expert en analyse sémantique.
Ta mission est de normaliser une liste de termes bruts concernant les BENEFICES de l'IA pour produire un nuage de mots.

Règles de normalisation :
1. Regroupe les concepts similaires sous un terme court (1 à 3 mots)
2. Supprime les tirets et ponctuation parasite
3. Chaque terme normalisé doit avoir un compte (nombre d'occurrences)
4. Vocabulaire UNIQUEMENT en Français - pas de mots anglais
5. IMPORTANT: Les expressions du type "gain de temps", "gagner du temps", "productivité", "efficacité", "performance", "gestion du temps" ou "automatisation" sont a regrouper sous le terme UNIQUE "Efficience"
6. IMPORTANT: "Recherche" (recherche internet, recherche d'information) est DIFFERENT de "Veille" (surveillance juridique, veille technologique) - ne pas les regrouper

FORMAT DE SORTIE OBLIGATOIRE - Une ligne par terme normalisé :
TERME_NORMALISE | expression1, expression2 | nombre

ATTENTION ! Aucune mise enforme gras, italique ou autre à appliquer sur les lignes à produire. 

Exemples de sortie attendue :
Efficience | productivité, gain de temps, efficacité, performance, gestion du temps | 8
Veille | veille juridique, surveillance | 2
Recherche | recherche internet, recherche d'information | 1

Voici la liste des termes à normaliser (un par ligne) :

{terms}
