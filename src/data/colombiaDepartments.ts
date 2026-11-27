export interface ColombiaDepartment {
  id: string;
  name: string;
  capital: string;
  educationalMessage: string;
  isOrigin?: boolean;
  cx: number;
  cy: number;
  paths: string[];
}

export const COLOMBIA_MAP_WIDTH = 896;
export const COLOMBIA_MAP_HEIGHT = 1200;

export const COLOMBIA_DEPARTMENTS: ColombiaDepartment[] = [
  {
    "id": "la-guajira",
    "name": "La Guajira",
    "capital": "Riohacha",
    "educationalMessage": "Educación virtual que llega al extremo norte, fortaleciendo la cultura wayúu y el emprendimiento sostenible.",
    "isOrigin": false,
    "cx": 489,
    "cy": 142,
    "paths": [
      "M540 78L564 85L573 108L558 121L521 131L501 165L484 171L461 211L445 210L446 202L446 196L437 192L434 184L413 185L411 166L416 156L435 154L465 129L491 120L500 113L506 101L505 92L515 92L518 97L524 93L524 86Z"
    ]
  },
  {
    "id": "atlantico",
    "name": "Atlántico",
    "capital": "Barranquilla",
    "educationalMessage": "Formación práctica en innovación, comercio y habilidades digitales para el talento del Caribe colombiano.",
    "isOrigin": false,
    "cx": 323,
    "cy": 195,
    "paths": [
      "M327 172L337 176L339 204L330 221L321 217L307 208L305 189Z"
    ]
  },
  {
    "id": "magdalena",
    "name": "Magdalena",
    "capital": "Santa Marta",
    "educationalMessage": "Acompañamiento educativo que impulsa el turismo sostenible, la gestión ambiental y el liderazgo juvenil.",
    "isOrigin": false,
    "cx": 370,
    "cy": 221,
    "paths": [
      "M381 151L415 156L409 170L411 186L416 190L414 207L397 214L382 233L399 260L399 267L389 267L381 273L390 285L389 292L397 298L396 306L388 305L378 303L368 291L353 289L337 275L339 265L332 251L337 239L327 232L328 221L339 203L336 171L364 175L371 170L372 155Z"
    ]
  },
  {
    "id": "cesar",
    "name": "Cesar",
    "capital": "Valledupar",
    "educationalMessage": "Capacitación continua para transformar la riqueza cultural y productiva del Cesar en nuevas oportunidades.",
    "isOrigin": false,
    "cx": 419,
    "cy": 268,
    "paths": [
      "M417 186L435 186L435 192L445 197L443 213L460 213L454 243L456 254L426 300L426 322L419 330L422 347L429 348L429 366L434 368L429 387L420 389L407 385L410 373L404 364L405 339L402 319L396 310L399 300L382 276L384 269L395 269L401 264L384 239L384 229L393 216L417 206Z"
    ]
  },
  {
    "id": "sucre",
    "name": "Sucre",
    "capital": "Sincelejo",
    "educationalMessage": "Programas virtuales accesibles que acercan el conocimiento técnico y social a las sabanas de Sucre.",
    "isOrigin": false,
    "cx": 316,
    "cy": 303,
    "paths": [
      "M284 243L291 243L293 250L300 251L300 265L309 263L326 277L331 299L346 309L351 344L345 351L337 349L326 338L310 342L304 337L301 315L311 307L308 300L280 282L286 268L281 259Z"
    ]
  },
  {
    "id": "bolivar",
    "name": "Bolívar",
    "capital": "Cartagena",
    "educationalMessage": "Educación de impacto que conecta historia, gestión empresarial y formación para el trabajo en Bolívar.",
    "isOrigin": false,
    "cx": 356,
    "cy": 323,
    "paths": [
      "M298 195L304 195L305 207L325 220L326 232L336 239L331 248L336 274L353 290L369 293L380 305L394 307L399 317L403 339L402 361L395 369L399 397L393 416L378 431L367 430L364 414L368 406L352 407L352 394L358 385L352 371L338 360L338 353L345 352L353 342L349 327L352 317L330 295L329 278L308 261L301 262L302 250L294 249L293 242L287 241L290 203Z"
    ]
  },
  {
    "id": "cordoba",
    "name": "Córdoba",
    "capital": "Montería",
    "educationalMessage": "Formación orientada al desarrollo agroindustrial, liderazgo comunitario y crecimiento profesional en Córdoba.",
    "isOrigin": false,
    "cx": 272,
    "cy": 346,
    "paths": [
      "M262 277L275 278L296 296L306 299L309 312L298 315L302 337L310 343L326 339L336 350L336 358L329 365L313 367L288 394L271 409L235 408L227 396L235 360L246 345L245 332L234 323L233 310L252 283Z"
    ]
  },
  {
    "id": "norte-de-santander",
    "name": "Norte de Santander",
    "capital": "Cúcuta",
    "educationalMessage": "Aulas digitales que impulsan el emprendimiento fronterizo, la productividad y el talento regional.",
    "isOrigin": false,
    "cx": 462,
    "cy": 363,
    "paths": [
      "M449 289L455 289L458 300L470 300L476 328L493 345L496 367L488 376L488 404L494 409L508 410L513 426L513 431L503 433L499 441L483 440L481 434L477 435L465 431L464 411L454 394L443 393L439 398L423 395L436 375L429 362L433 342L421 338L421 327L428 319L428 297L441 296Z"
    ]
  },
  {
    "id": "antioquia",
    "name": "Antioquia",
    "capital": "Medellín",
    "educationalMessage": "Educación continua e innovación tecnológica para potenciar la creatividad y el espíritu emprendedor antioqueño.",
    "isOrigin": false,
    "cx": 288,
    "cy": 441,
    "paths": [
      "M227 315L232 315L245 338L226 389L228 400L237 410L269 410L309 369L338 360L352 374L356 392L350 397L350 406L362 413L365 430L375 433L387 420L392 420L395 437L362 464L363 476L349 491L349 508L341 518L330 516L319 521L310 532L303 530L299 520L286 517L284 529L262 533L252 523L252 503L243 496L240 485L213 487L208 480L208 467L200 458L198 446L208 443L207 434L223 435L227 421L189 387L189 382L195 372L203 377L213 373L212 346L202 335L202 329L218 324Z"
    ]
  },
  {
    "id": "santander",
    "name": "Santander",
    "capital": "Bucaramanga",
    "educationalMessage": "Formación técnica y liderazgo profesional que respaldan la pujanza empresarial y educativa de Santander.",
    "isOrigin": false,
    "cx": 422,
    "cy": 455,
    "paths": [
      "M401 385L416 387L422 396L436 400L440 395L454 395L463 411L463 431L481 436L488 443L484 468L475 472L471 464L468 466L469 488L457 501L445 501L435 514L429 511L434 503L428 494L416 504L415 515L397 517L377 506L372 494L362 496L358 489L358 479L365 474L364 460L397 435L393 418Z"
    ]
  },
  {
    "id": "arauca",
    "name": "Arauca",
    "capital": "Arauca",
    "educationalMessage": "Educación sin barreras que llega a la Orinoquía para fortalecer el talento joven y el desarrollo local.",
    "isOrigin": false,
    "cx": 586,
    "cy": 462,
    "paths": [
      "M597 430L609 430L628 440L644 438L684 494L658 496L640 482L628 480L615 485L585 484L537 485L508 493L499 484L499 477L511 467L523 434L540 431L581 437Z"
    ]
  },
  {
    "id": "choco",
    "name": "Chocó",
    "capital": "Quibdó",
    "educationalMessage": "Oportunidades de aprendizaje virtual inclusivo que acompañan la biodiversidad, cultura y liderazgo del Pacífico.",
    "isOrigin": false,
    "cx": 196,
    "cy": 503,
    "paths": [
      "M169 329L174 329L198 358L188 387L225 421L224 432L207 433L206 443L196 448L197 457L206 467L205 478L214 489L240 487L242 497L249 500L248 512L254 526L250 538L242 543L250 568L224 604L229 620L217 626L184 618L180 613L163 613L172 578L167 538L159 526L171 523L176 515L170 495L163 489L171 463L149 443L150 433L137 421L137 414L140 405L147 402L146 390L160 399L171 378L182 373L172 347L165 340Z"
    ]
  },
  {
    "id": "boyaca",
    "name": "Boyacá",
    "capital": "Tunja",
    "educationalMessage": "Tradición académica y formación virtual de calidad para el campo, la industria y la comunidad boyacense.",
    "isOrigin": false,
    "cx": 454,
    "cy": 516,
    "paths": [
      "M352 485L357 485L363 497L372 496L375 511L369 512L349 514Z",
      "M509 433L519 433L520 440L511 456L511 467L492 486L495 505L490 510L498 513L501 523L480 544L468 540L462 546L458 553L461 564L452 570L451 585L442 585L430 571L423 570L424 552L418 540L408 533L402 530L395 541L376 534L371 510L384 508L397 518L415 517L417 502L428 495L432 498L428 514L433 515L442 503L455 502L470 486L473 474L485 467L489 443Z"
    ]
  },
  {
    "id": "casanare",
    "name": "Casanare",
    "capital": "Yopal",
    "educationalMessage": "Capacitación práctica y flexible que impulsa la gestión empresarial y el crecimiento sostenible en los Llanos.",
    "isOrigin": false,
    "cx": 545,
    "cy": 539,
    "paths": [
      "M622 483L641 484L647 492L657 495L657 502L641 522L607 537L601 549L586 558L581 571L536 591L524 603L511 599L497 607L474 608L467 600L453 582L454 567L461 565L460 550L465 542L476 546L490 531L500 529L502 517L494 511L494 484L514 495L531 488L568 484L613 487Z"
    ]
  },
  {
    "id": "caldas",
    "name": "Caldas",
    "capital": "Manizales",
    "educationalMessage": "Formación complementaria para el Eje Cafetero, sumando herramientas digitales al talento universitario y laboral.",
    "isOrigin": false,
    "cx": 306,
    "cy": 542,
    "paths": [
      "M341 517L347 519L344 544L325 546L317 555L309 556L302 564L301 578L296 578L290 568L277 567L275 563L267 567L268 557L273 548L283 545L280 539L269 541L269 532L286 532L287 521L299 521L307 534L317 528L318 522Z"
    ]
  },
  {
    "id": "risaralda",
    "name": "Risaralda",
    "capital": "Pereira",
    "educationalMessage": "Educación innovadora que impulsa el emprendimiento, el comercio y la competitividad profesional en Risaralda.",
    "isOrigin": false,
    "cx": 264,
    "cy": 557,
    "paths": [
      "M252 532L265 535L272 543L265 566L269 570L291 570L296 580L288 583L264 579L244 549L244 540L249 540Z"
    ]
  },
  {
    "id": "cundinamarca",
    "name": "Cundinamarca y Bogotá D.C.",
    "capital": "Bogotá D.C.",
    "educationalMessage": "Formación continua y certificada que conecta el centro del país con habilidades de alta demanda laboral.",
    "isOrigin": false,
    "cx": 383,
    "cy": 574,
    "paths": [
      "M365 514L370 514L373 532L390 543L400 531L417 539L424 560L421 570L431 572L444 587L451 587L448 613L422 610L419 596L413 596L403 607L405 618L385 626L385 615L387 598L392 592L390 577L377 591L377 617L368 626L364 643L356 642L357 614L335 610L348 516Z"
    ]
  },
  {
    "id": "vichada",
    "name": "Vichada",
    "capital": "Puerto Carreño",
    "educationalMessage": "Educación a distancia que acorta distancias y acerca el conocimiento a los municipios más apartados del oriente.",
    "isOrigin": false,
    "cx": 687,
    "cy": 581,
    "paths": [
      "M783 481L804 483L811 497L810 506L799 520L800 536L787 545L790 565L786 593L791 599L790 612L796 628L789 633L759 629L745 642L732 641L710 650L679 647L675 656L664 656L653 666L643 668L640 680L632 684L631 699L622 703L582 698L582 568L588 557L604 545L606 538L638 524L659 498L678 498L688 490L697 495L705 486L736 491L775 487Z"
    ]
  },
  {
    "id": "quindio",
    "name": "Quindío",
    "capital": "Armenia",
    "educationalMessage": "Aprendizaje práctico enfocado en cultura cafetera, servicio, tecnología y desarrollo comunitario en el Quindío.",
    "isOrigin": false,
    "cx": 279,
    "cy": 599,
    "paths": [
      "M281 584L296 586L296 592L287 599L280 619L272 621L268 590L278 589Z"
    ]
  },
  {
    "id": "tolima",
    "name": "Tolima",
    "capital": "Ibagué",
    "educationalMessage": "Formación integral que combina tradición cultural, gestión administrativa y nuevas competencias digitales.",
    "isOrigin": false,
    "cx": 309,
    "cy": 625,
    "paths": [
      "M331 546L341 548L342 555L333 610L344 615L356 613L355 642L335 672L323 673L323 664L309 664L296 669L290 677L274 693L261 691L258 675L262 648L284 614L289 596L302 581L306 557L316 556L323 547Z"
    ]
  },
  {
    "id": "valle-del-cauca",
    "name": "Valle del Cauca",
    "capital": "Cali",
    "educationalMessage": "Programas virtuales y empresariales que potencian el liderazgo, la industria y la empleabilidad del suroccidente.",
    "isOrigin": false,
    "cx": 225,
    "cy": 636,
    "paths": [
      "M250 567L255 567L263 580L274 582L266 593L266 603L271 606L269 620L275 629L260 649L258 676L230 669L223 683L198 684L191 680L178 683L167 674L164 666L180 652L186 636L173 638L176 625L165 628L162 618L181 615L185 620L218 628L232 617L226 602Z"
    ]
  },
  {
    "id": "meta",
    "name": "Meta",
    "capital": "Villavicencio",
    "educationalMessage": "Educación flexible para los Llanos Orientales, impulsando proyectos productivos y formación para el trabajo.",
    "isOrigin": false,
    "cx": 460,
    "cy": 669,
    "paths": [
      "M573 575L579 575L580 696L515 699L481 716L465 717L459 725L436 731L420 729L411 737L411 776L388 777L372 766L357 763L352 743L346 739L348 730L355 711L351 701L337 695L337 690L347 681L353 672L353 661L372 638L408 617L405 603L409 599L415 599L423 612L447 616L453 590L458 590L475 611L494 609L506 602L521 605L535 592Z"
    ]
  },
  {
    "id": "guainia",
    "name": "Guainía",
    "capital": "Inírida",
    "educationalMessage": "Educación incluyente que abre caminos de aprendizaje y crecimiento personal en la Amazonía y Orinoquía.",
    "isOrigin": false,
    "cx": 727,
    "cy": 709,
    "paths": [
      "M791 630L799 631L801 641L813 647L816 659L823 665L819 678L791 704L808 705L808 712L831 730L829 739L836 747L852 802L836 804L836 776L824 762L818 746L807 756L797 758L790 770L779 769L768 756L762 766L764 773L749 773L685 770L661 774L646 769L643 758L652 740L612 736L601 715L629 701L634 696L635 682L643 678L643 670L652 669L660 659L674 658L678 649L716 651L747 642L755 632L786 635Z"
    ]
  },
  {
    "id": "cauca",
    "name": "Cauca · Sede origen",
    "capital": "Popayán",
    "educationalMessage": "Desde Popayán nace Fundación ULEP, impulsando educación transformadora, liderazgo social y oportunidades para toda Colombia.",
    "isOrigin": true,
    "cx": 203,
    "cy": 727,
    "paths": [
      "M224 702L233 702L239 709L239 721L231 726L216 719L216 709Z",
      "M229 671L256 678L263 698L274 707L274 717L272 724L263 722L256 730L244 730L234 748L225 747L220 752L220 763L230 767L238 781L248 782L242 804L251 816L226 815L226 796L220 788L212 793L201 796L204 781L195 771L173 775L180 757L172 752L172 744L168 739L143 740L133 711L145 707L152 693L150 685L160 674L166 674L179 685L203 686L221 685Z"
    ]
  },
  {
    "id": "huila",
    "name": "Huila",
    "capital": "Neiva",
    "educationalMessage": "Formación continua que fortalece el emprendimiento agropecuario, cultural y profesional en el sur colombiano.",
    "isOrigin": false,
    "cx": 286,
    "cy": 721,
    "paths": [
      "M354 643L361 643L362 650L351 665L347 682L325 703L323 716L306 731L304 739L273 774L264 781L238 780L232 768L223 763L221 750L233 749L242 731L252 732L260 724L273 725L276 711L266 700L266 694L285 685L292 671L301 667L322 665L321 673L331 674Z"
    ]
  },
  {
    "id": "guaviare",
    "name": "Guaviare",
    "capital": "San José del Guaviare",
    "educationalMessage": "Acompañamiento educativo virtual para promover el desarrollo sostenible y nuevas oportunidades en el Guaviare.",
    "isOrigin": false,
    "cx": 512,
    "cy": 758,
    "paths": [
      "M566 699L610 706L610 711L595 718L606 725L608 734L619 740L649 739L650 746L638 754L594 760L574 774L563 772L546 816L540 816L521 837L506 834L502 828L493 815L476 806L462 809L455 823L447 823L428 807L427 798L413 781L414 733L454 728L462 719L479 718L486 711L510 702Z"
    ]
  },
  {
    "id": "narino",
    "name": "Nariño",
    "capital": "Pasto",
    "educationalMessage": "Educación de calidad que abraza la riqueza cultural, artesanal y académica del sur de Colombia.",
    "isOrigin": false,
    "cx": 136,
    "cy": 781,
    "paths": [
      "M112 711L130 713L145 743L170 743L170 751L177 755L171 770L174 777L195 773L202 780L199 800L193 801L185 813L190 821L181 840L186 844L186 857L169 856L163 855L163 841L152 837L149 828L132 828L118 821L105 807L96 807L64 779L74 764L91 767L95 763L87 739L99 717Z"
    ]
  },
  {
    "id": "caqueta",
    "name": "Caquetá",
    "capital": "Florencia",
    "educationalMessage": "Aulas digitales accesibles que impulsan el emprendimiento, la conservación ambiental y el talento caqueteño.",
    "isOrigin": false,
    "cx": 392,
    "cy": 830,
    "paths": [
      "M332 695L348 699L353 710L344 738L350 742L353 760L358 765L372 768L391 780L411 779L425 798L427 809L448 825L462 819L468 809L488 813L504 835L517 839L538 865L559 872L559 877L543 882L534 896L517 899L503 919L493 916L489 922L480 923L474 917L461 919L457 914L441 919L436 913L422 913L409 905L391 903L369 887L353 886L349 871L327 863L326 852L313 849L309 835L294 832L286 825L270 824L266 815L244 805L250 784L260 783L274 772L295 744L305 738L307 728L325 714L324 703Z"
    ]
  },
  {
    "id": "vaupes",
    "name": "Vaupés",
    "capital": "Mitú",
    "educationalMessage": "Formación virtual sin fronteras pensada para llevar conocimiento y acompañamiento al corazón amazónico.",
    "isOrigin": false,
    "cx": 614,
    "cy": 838,
    "paths": [
      "M639 753L644 753L640 763L644 768L663 776L664 812L699 814L708 826L705 844L692 842L686 836L680 843L651 850L651 887L660 900L678 910L682 918L679 929L689 949L673 953L671 946L661 947L657 940L646 947L635 943L635 908L622 910L612 902L596 901L590 884L563 870L544 867L520 842L538 817L553 810L551 800L562 775L571 776L593 761L608 762Z"
    ]
  },
  {
    "id": "putumayo",
    "name": "Putumayo",
    "capital": "Mocoa",
    "educationalMessage": "Educación con propósito social que apoya el liderazgo comunitario, la sostenibilidad y el desarrollo del Putumayo.",
    "isOrigin": false,
    "cx": 266,
    "cy": 851,
    "paths": [
      "M214 790L220 790L224 796L223 813L229 818L241 820L262 815L274 828L289 828L293 834L308 836L310 848L322 850L328 865L347 870L347 879L354 889L367 889L378 898L389 900L394 910L375 917L366 917L357 908L346 904L342 893L333 895L321 885L307 889L289 879L276 878L260 861L248 856L237 857L234 867L229 868L193 863L184 842L192 823L188 817L189 804Z"
    ]
  },
  {
    "id": "amazonas",
    "name": "Amazonas",
    "capital": "Leticia",
    "educationalMessage": "Conocimiento sin fronteras que conecta la riqueza natural y cultural del Amazonas con aulas digitales de calidad.",
    "isOrigin": false,
    "cx": 554,
    "cy": 978,
    "paths": [
      "M561 876L587 883L597 903L612 903L621 912L635 909L633 942L642 950L648 948L648 942L657 941L659 949L671 947L672 955L690 954L690 975L686 980L658 1145L644 1138L635 1122L618 1125L609 1120L647 1053L630 1040L612 1037L608 1031L591 1024L580 1031L563 1033L561 1027L541 1018L529 1030L521 1030L515 1036L485 1033L463 1038L459 1031L449 1027L453 1015L446 998L423 992L426 981L417 965L402 960L392 949L379 946L378 935L370 925L370 919L401 908L412 908L423 916L436 915L442 921L458 916L462 921L475 919L481 925L490 919L499 922L516 900L531 899L543 882Z"
    ]
  }
];
