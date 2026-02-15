(*
**Esercizio 2bis.1.** Scrivere una funzione `contamax` che prende una lista `lis` e restituisce il numero di occorrenze del valore massimo. Si può assumere che la lista non sia vuota (definendo quindi una funzione parziale, non definita su lista vuota) oppure restituire un valore arbirario nel caso di lista vuota. Ad esempio, `contamax [3;4;2;3;4;1;4]` restituisce `3` in quanto il valore massimo (che è `4`) occorre tre volte nella lista.
*)

let contamax lis = 
  let max = List.fold_left (fun acc x -> if x>acc then x else acc) min_int lis in
  List.length (List.filter (fun x->x=max) lis)
;;
contamax [3;4;2;3;4;1;4];;
contamax [];;