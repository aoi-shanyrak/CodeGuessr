let separa lis =
  let rec cup lis (acc1, acc2) =
      match lis with
      | [] -> (acc1, acc2)
      | (a1,b1)::lis' -> cup lis' (acc1@[a1],acc2@[b1])
  in
  let rec aux lis (lis1, lis2) =
      match lis with
      | [] -> (lis1,lis2)
      | sublis::lis' -> 
          let (f,s) = cup sublis ([],[]) in
          aux lis' (lis1@[f],lis2@[s])
  in
  aux lis ([],[])
;;


separa [[(1,'a');(2,'b');(3,'c')];[(4,'d');(5,'e')]]

(*
val separa : ('a * 'b) list list -> 'a list list * 'b list list = <fun>
- : int list list * char list list = ([[1; 2; 3]; [4; 5]], [['a'; 'b'; 'c']; ['d'; 'e']])
*)