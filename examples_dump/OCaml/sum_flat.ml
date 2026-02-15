(*
**Esercizio 2bis.4.** Scrivere una funzione `sumflat` che prende una lista di liste di interi `lis` e restituisce una lista in cui ogni elemento corrisponde alla somma degli elementi di una lista di interi in `lis`. Ad esempio, `sumflat [[8;2];[];[6;3;4]]` restituisce `[10;0;13]`.
*)

let sumflat lis =
  List.map (fun elem -> (List.fold_left (+) 0 elem)) lis
;;

sumflat []