(*
## Pack Consecutive Duplicates
*)

let pack lst =
  let rec packcons lst (acc) =
      match lst with
      | [] -> acc
      | x::lst' -> if x=
  let rec aux lst acc =
      match lst with
      | [] -> acc
      | x::lst' -> aux 
  in
  aux lst []
;;


pack ["a"; "a"; "a"; "a"; "b"; "c"; "c"; "a"; "a"; "d"; "d"; "e"; "e"; "e"; "e"];;