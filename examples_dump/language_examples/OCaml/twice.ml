(*
**Esercizio 2bis.3.** Scrivere una funzione `twice` che prende una lista `lis` e un intero `n` e restituisce `true` se la `n` occorre esattamente due volte in `lis`, restituisce `false` altrimenti.
*)

let twice lst n =
  (List.length (List.filter (fun z->z=n) lst))=2
;;
twice [1;2;3;4;1] 1;;
twice [1;2;3;4;1] 2