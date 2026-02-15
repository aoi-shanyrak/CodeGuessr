(*
## Flatten a nested list structure.
*)

type 'a node =
  | One of 'a 
  | Many of 'a node list
  
let list = [One "a"; Many [One "b"; Many [One "c" ;One "d"]; One "e"]];;


let flatten list =
    let rec aux list acc = 
        match list with
          | [] -> acc
          | One x :: t -> aux t (x :: acc)
          | Many l :: t -> aux t (aux l acc)
    in
    List.rev (aux list [])
;;


flatten list