(* Esercizio 3.1. Considerando il tipo 'a colored_tree che rappresenta alberi con nodi colorati definito
nell'esercizio 1, scrivere una funzione raccogli che, dato un albero di questo tipo, restituisce una tripla di
liste (l1,l2,l3) di tipo 'a list * 'a list * 'a list dove l1 contiene tutti i valori contenuti nei nodi
Black, l2 tutti i valori nei nodi Red ed l3 tutti i valori nei nodi Blue. Ad esempio, dato il seguente albero:
let tree = Red ("a",
Blue ("b",
Black "c",
Red ( "d", Black "e", Black "f")),
Red ( "g",
Blue ( "h", Black "i", Black "j"),
Black "k")) ;;
l'applicazione raccogli tree deve dare come risultato:
(["c"; "e"; "f"; "i"; "j"; "k"], ["a"; "d"; "g"], ["b"; "h"])
L'ordine degli elementi nelle liste pu`o essere diverso rispetto a questo esempio. *)

type 'a colored_tree =
| Black of 'a
| Red of 'a*('a colored_tree)*('a colored_tree)
| Blue of 'a*('a colored_tree)*('a colored_tree) ;;

let raccogli tree =
  let rec aux tree acc =
      match tree with 
      | Black(n) -> let (black, red, blue) = acc in (black@[n], red, blue)
      | Red(n, sx, dx) ->
          let (black, red, blue) = aux sx acc in            
          let (black', red', blue') = aux dx acc in
          (black@black', (red@red')@[n], blue@blue')
      | Blue(n, sx, dx) ->
          let (black, red, blue) = aux sx acc in            
          let (black', red', blue') = aux dx acc in
          (black@black', (red@red'), (blue@blue')@[n])
      in
      aux tree ([],[],[])
;;

let tree = Red ("a",
Blue ("b",
Black "c",
Red ( "d", Black "e", Black "f")),
Red ( "g",
Blue ( "h", Black "i", Black "j"),
Black "k")) ;;

raccogli tree;;