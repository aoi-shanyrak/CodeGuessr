(* Esercizio 3.3. Utilizzando le funzioni higher-order su liste, scrivere una funzione massimo_unico che,
data una lista lis, restituisca true se il valore massimo in lis `e unico, e false se lis contiene pi`u di una
istanza del suo valore massimo, oppure se lis `e vuota *)

let massimo_unico lis =
  if (List.length lis)=0 then false
  else
  let max_elem = List.fold_left (fun acc x -> if x>acc then x else acc) (-max_int) lis
  in
  (List.fold_left (fun acc x -> if x=max_elem then acc+1 else acc) 0 lis)=1
;;
  
let list = [1;3;6;9];;
massimo_unico list;;