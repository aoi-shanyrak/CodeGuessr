(*
**Esercizio 2bis.2.** Scrivere una funzione `noripetizioni` che prende una lista di interi e restituisce una lista con gli stessi elementi ma senza ripetizioni.
*)

let noripetizioni lis =
  let rec noripetizioni_aux lis acc = 
      match lis with
      | [] -> acc
      | x::lst' -> if (List.exists (fun z -> z=x) acc) then 
          noripetizioni_aux lst' acc else noripetizioni_aux lst' (acc@[x])
  in
  noripetizioni_aux lis []
;;

noripetizioni [1;2;3;4;5;5;5;2;7]