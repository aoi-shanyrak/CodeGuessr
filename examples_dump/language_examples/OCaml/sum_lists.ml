(* Esercizio 2.2. Scrivere una funzione ricorsiva somma_liste che, date due liste [x1;...;xn] e [y1;...;yn]
di uguale lunghezza, restituisca la lista [x1+y1; ... ;xn+yn]. Se le liste hanno lunghezze diverse, la
funzione restituisce la lista vuota. *)

let rec somma_liste lis1 lis2 =
  if List.length lis1 <> List.length lis2 then []
  else
  match lis1, lis2 with
  | [], [] -> []
  | x::lis1', y::lis2' ->  (x+y)::(somma_liste lis1' lis2')
  | _ -> failwith "Eccezione";;
  
let lis1 = [1;2;3;4];;
let lis2 = [1;2;3;4];;

somma_liste lis1 lis2;;