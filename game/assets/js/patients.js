// patients.js - Declarative patient management system
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import SlotSystem from './slot-system.js';
import { registerPatientIv } from './iv-system.js';
import { loadPastHxPack, ensurePastHxTimeline } from './past-hx-timeline.js';
import { inferMedSlotKind } from './media-placeholders.js';
import { decorateSepsisScreenDice } from './challenges/skills/sepsis-recognition/challenge.js';

const PatientsModule = (() => {
    console.log("Patients module initialized");

    // Patient data structure
    const patientConfigs = {
        joe: {
            id: 'joe',
            name: 'Joe Johnson',
            room: 'Room 201-A',
            age: 68,
            sex: 'Male',
            diagnosis: 'Post-op Total Hip Replacement',
            /** BMI 38 + post-op mobility limits → pressure-injury risk */
            careSchedules: ['turnQ2h'],
            careReason: 'BMI 38; limited mobility post THA — cannot self-reposition',
            vitals: {
                hr: 82,
                bp: '128/78',
                temp: '98.6°F',
                o2: '96%',
                pain: '1/10 R hip',
                rr: 18
            },
            htmlFile: 'events/patients/joe.html',
            pastHxFile: 'events/patients/joe-past-hx.json'
        },
        maria: {
            id: 'maria',
            name: 'Maria Santos',
            room: 'Room 204-B',
            age: 54,
            sex: 'Female',
            diagnosis: 'Community-acquired pneumonia',
            /** Bedbound / too weak to turn independently */
            careSchedules: ['turnQ2h'],
            careReason: 'Bedbound; profound weakness from CAP — cannot self-turn',
            vitals: {
                hr: 94,
                bp: '118/72',
                temp: '100.8°F',
                o2: '93% on 2L NC',
                pain: '0/10',
                rr: 22
            },
            htmlFile: 'events/patients/maria.html',
            pastHxFile: 'events/patients/maria-past-hx.json'
        },
        derek: {
            id: 'derek',
            name: 'Derek Nguyen',
            room: 'Room 203-A',
            age: 71,
            sex: 'Male',
            diagnosis: 'COPD exacerbation',
            /** Prior CVA residual weakness + obesity → Q2H turns */
            careSchedules: ['turnQ2h'],
            careReason: 'Class III obesity; prior CVA with residual weakness — bedbound',
            htmlFile: 'events/patients/derek.html',
            pastHxFile: 'events/patients/derek-past-hx.json'
        },
        aisha: {
            id: 'aisha',
            name: 'Aisha Rahman',
            room: 'Room 205-C',
            age: 29,
            sex: 'Female',
            diagnosis: 'DKA resolving',
            htmlFile: 'events/patients/aisha.html',
            pastHxFile: 'events/patients/aisha-past-hx.json'
        },
        robert: {
            id: 'robert',
            name: 'Robert Hale',
            room: 'Room 202-B',
            age: 62,
            sex: 'Male',
            diagnosis: 'NSTEMI rule-out',
            htmlFile: 'events/patients/robert.html',
            pastHxFile: 'events/patients/robert-past-hx.json'
        },
        lin: {
            id: 'lin',
            name: 'Lin Chen',
            room: 'Room 206-A',
            age: 45,
            sex: 'Female',
            diagnosis: 'Post-op lap cholecystectomy',
            htmlFile: 'events/patients/lin.html',
            pastHxFile: 'events/patients/lin-past-hx.json'
        },
        elena: {
            id: 'elena',
            name: 'Elena Vargas',
            room: 'Room ICU-1',
            age: 58,
            sex: 'Female',
            diagnosis: 'Spontaneous ICH with EVD — ICP monitoring',
            skills: ['icp', 'neuro-checks'],
            careSchedules: ['turnQ2h'],
            careReason: 'ICH with EVD; sedated — cannot self-reposition',
            vitals: {
                hr: 68,
                bp: '148/82',
                temp: '99.1°F',
                o2: '98% on 2L NC',
                pain: 'sedated',
                rr: 14
            },
            htmlFile: 'events/patients/elena.html',
            pastHxFile: 'events/patients/elena-past-hx.json'
        },
        omar: {
            id: 'omar',
            name: 'Omar Hassan',
            room: 'Room ICU-3',
            age: 41,
            sex: 'Male',
            diagnosis: 'New-onset seizures — workup; seizure precautions',
            skills: ['seizure-precautions'],
            vitals: {
                hr: 88,
                bp: '128/76',
                temp: '98.8°F',
                o2: '97% RA',
                pain: '0/10',
                rr: 18
            },
            htmlFile: 'events/patients/omar.html',
            pastHxFile: 'events/patients/omar-past-hx.json'
        },
        priya: {
            id: 'priya',
            name: 'Priya Nair',
            room: 'Room ICU-2',
            age: 67,
            sex: 'Female',
            diagnosis: 'Acute ischemic stroke — post-tPA watch',
            skills: ['stroke-assessment'],
            careSchedules: ['turnQ2h'],
            careReason: 'Acute stroke with hemiparesis — cannot self-reposition',
            vitals: {
                hr: 92,
                bp: '162/88',
                temp: '98.6°F',
                o2: '96% RA',
                pain: '0/10',
                rr: 18
            },
            htmlFile: 'events/patients/priya.html',
            pastHxFile: 'events/patients/priya-past-hx.json'
        },
        dante: {
            id: 'dante',
            name: 'Dante Ruiz',
            room: 'Room 312-A',
            age: 52,
            sex: 'Male',
            diagnosis: 'Spontaneous pneumothorax — right chest tube',
            skills: ['chest-tube'],
            vitals: {
                hr: 96,
                bp: '124/74',
                temp: '98.9°F',
                o2: '94% on 2L NC',
                pain: '4/10 R chest',
                rr: 22
            },
            htmlFile: 'events/patients/dante.html',
            pastHxFile: 'events/patients/dante-past-hx.json'
        },
        kei: {
            id: 'kei',
            name: 'Kei Nakamura',
            room: 'Room ICU-4',
            age: 63,
            sex: 'Male',
            diagnosis: 'Prolonged vent wean — new tracheostomy (POD 1)',
            skills: ['trach-care'],
            careSchedules: ['turnQ2h'],
            careReason: 'Fresh trach; sedated / weak — cannot self-reposition',
            vitals: {
                hr: 78,
                bp: '118/70',
                temp: '99.0°F',
                o2: '96% on trach collar 28%',
                pain: '2/10 neck',
                rr: 16
            },
            htmlFile: 'events/patients/kei.html',
            pastHxFile: 'events/patients/kei-past-hx.json'
        },
        nora: {
            id: 'nora',
            name: 'Nora Blake',
            room: 'Room 308-B',
            age: 74,
            sex: 'Female',
            diagnosis: 'COPD exacerbation — oxygen titration',
            skills: ['oxygen-therapy'],
            vitals: {
                hr: 102,
                bp: '138/84',
                temp: '99.2°F',
                o2: '89% on 2L NC',
                pain: '0/10',
                rr: 24
            },
            htmlFile: 'events/patients/nora.html',
            pastHxFile: 'events/patients/nora-past-hx.json'
        },
        samir: {
            id: 'samir',
            name: 'Samir Okonkwo',
            room: 'Room ICU-5',
            age: 56,
            sex: 'Male',
            diagnosis: 'ARDS — mechanical ventilation',
            skills: ['ventilator-basics'],
            careSchedules: ['turnQ2h'],
            careReason: 'Intubated / sedated — cannot self-reposition',
            vitals: {
                hr: 110,
                bp: '102/58',
                temp: '100.4°F',
                o2: '94% on FiO2 0.60',
                pain: 'sedated',
                rr: 18
            },
            htmlFile: 'events/patients/samir.html',
            pastHxFile: 'events/patients/samir-past-hx.json'
        },
        hana: {
            id: 'hana',
            name: 'Hana Kim',
            room: 'Room 314-A',
            age: 48,
            sex: 'Female',
            diagnosis: 'Post-op anemia — PRBC transfusion ordered',
            skills: ['blood-transfusion'],
            vitals: {
                hr: 108,
                bp: '98/58',
                temp: '98.4°F',
                o2: '97% RA',
                pain: '3/10 incision',
                rr: 18
            },
            htmlFile: 'events/patients/hana.html',
            pastHxFile: 'events/patients/hana-past-hx.json'
        },
        vito: {
            id: 'vito',
            name: 'Vito Moretti',
            room: 'Room 316-B',
            age: 61,
            sex: 'Male',
            diagnosis: 'Open abdominal wound — NPWT / wound vac',
            skills: ['wound-vac'],
            vitals: {
                hr: 86,
                bp: '122/76',
                temp: '99.0°F',
                o2: '97% RA',
                pain: '4/10 abdomen',
                rr: 16
            },
            htmlFile: 'events/patients/vito.html',
            pastHxFile: 'events/patients/vito-past-hx.json'
        },
        clara: {
            id: 'clara',
            name: 'Clara Nguyen',
            room: 'Room 315-A',
            age: 52,
            sex: 'Female',
            diagnosis: 'Post-op laparotomy incision — sterile dressing change',
            skills: ['wound-care'],
            vitals: {
                hr: 88,
                bp: '118/72',
                temp: '99.1°F',
                o2: '98% RA',
                pain: '5/10 incision',
                rr: 16
            },
            htmlFile: 'events/patients/clara.html',
            pastHxFile: 'events/patients/clara-past-hx.json'
        },
        ruth: {
            id: 'ruth',
            name: 'Ruth Alvarez',
            room: 'Room 312-B',
            age: 79,
            sex: 'Female',
            diagnosis: 'Failure to thrive — high pressure-injury risk (bedbound)',
            skills: ['pressure-injury'],
            vitals: {
                hr: 78,
                bp: '110/64',
                temp: '98.2°F',
                o2: '96% RA',
                pain: '2/10 sacrum',
                rr: 16
            },
            htmlFile: 'events/patients/ruth.html',
            pastHxFile: 'events/patients/ruth-past-hx.json'
        },
        jade: {
            id: 'jade',
            name: 'Jade Ortiz',
            room: 'Room 311-A',
            age: 44,
            sex: 'Female',
            diagnosis: 'Post-op TKA — morphine PCA',
            skills: ['pca-pump'],
            vitals: {
                hr: 84,
                bp: '128/76',
                temp: '98.8°F',
                o2: '97% RA',
                pain: '6/10 knee (PCA)',
                rr: 14
            },
            htmlFile: 'events/patients/jade.html',
            pastHxFile: 'events/patients/jade-past-hx.json'
        },
        cole: {
            id: 'cole',
            name: 'Cole Brennan',
            room: 'Room 309-C',
            age: 57,
            sex: 'Male',
            diagnosis: 'Post-op open cholecystectomy — acute pain',
            skills: ['pain-assessment'],
            vitals: {
                hr: 96,
                bp: '142/88',
                temp: '99.0°F',
                o2: '97% RA',
                pain: '8/10 RUQ incision',
                rr: 18
            },
            htmlFile: 'events/patients/cole.html',
            pastHxFile: 'events/patients/cole-past-hx.json'
        },
        inez: {
            id: 'inez',
            name: 'Inez Delgado',
            room: 'Room 307-A',
            age: 68,
            sex: 'Female',
            diagnosis: 'Post-op hip ORIF — indwelling Foley',
            skills: ['foley-care'],
            vitals: {
                hr: 82,
                bp: '132/78',
                temp: '98.6°F',
                o2: '97% RA',
                pain: '4/10 hip',
                rr: 16
            },
            htmlFile: 'events/patients/inez.html',
            pastHxFile: 'events/patients/inez-past-hx.json'
        },
        theo: {
            id: 'theo',
            name: 'Theo Park',
            room: 'Room 306-B',
            age: 63,
            sex: 'Male',
            diagnosis: 'Small bowel obstruction — NG to low intermittent suction',
            skills: ['ng-tube'],
            vitals: {
                hr: 92,
                bp: '118/70',
                temp: '98.9°F',
                o2: '97% RA',
                pain: '5/10 abdomen',
                rr: 18
            },
            htmlFile: 'events/patients/theo.html',
            pastHxFile: 'events/patients/theo-past-hx.json'
        },
        gina: {
            id: 'gina',
            name: 'Gina Rossi',
            room: 'Room 305-A',
            age: 59,
            sex: 'Female',
            diagnosis: 'New end colostomy — POD 1 pouch change',
            skills: ['ostomy-care'],
            vitals: {
                hr: 86,
                bp: '124/74',
                temp: '99.0°F',
                o2: '98% RA',
                pain: '4/10 abdomen',
                rr: 16
            },
            htmlFile: 'events/patients/gina.html',
            pastHxFile: 'events/patients/gina-past-hx.json'
        },
        lyle: {
            id: 'lyle',
            name: 'Lyle Okonkwo',
            room: 'ICU-3',
            age: 55,
            sex: 'Male',
            diagnosis: 'Septic shock — triple-lumen central line',
            skills: ['central-line'],
            vitals: {
                hr: 112,
                bp: '88/52',
                temp: '101.2°F',
                o2: '94% on 4L NC',
                pain: '2/10',
                rr: 24
            },
            htmlFile: 'events/patients/lyle.html',
            pastHxFile: 'events/patients/lyle-past-hx.json'
        },
        quinn: {
            id: 'quinn',
            name: 'Quinn Adler',
            room: 'Room 304-B',
            age: 51,
            sex: 'Non-binary',
            diagnosis: 'Community-acquired pneumonia — ceftriaxone IVPB due',
            skills: ['ivpb-hang'],
            vitals: {
                hr: 98,
                bp: '128/78',
                temp: '100.6°F',
                o2: '94% on 2L NC',
                pain: '1/10',
                rr: 22
            },
            htmlFile: 'events/patients/quinn.html',
            pastHxFile: 'events/patients/quinn-past-hx.json'
        },
        wes: {
            id: 'wes',
            name: 'Wes Callahan',
            room: 'Room 303-A',
            age: 66,
            sex: 'Male',
            diagnosis: 'CAD / hyperlipidemia — evening meds due',
            skills: ['med-identity'],
            vitals: {
                hr: 76,
                bp: '136/82',
                temp: '98.4°F',
                o2: '98% RA',
                pain: '0/10',
                rr: 14
            },
            htmlFile: 'events/patients/wes.html',
            pastHxFile: 'events/patients/wes-past-hx.json'
        },
        piper: {
            id: 'piper',
            name: 'Piper Hale',
            room: 'Room 302-A',
            age: 0,
            sex: 'Unknown',
            diagnosis: 'Incoming ED admit — bed not ready',
            skills: ['bed-prep'],
            vitals: {},
            htmlFile: 'events/patients/piper.html',
            pastHxFile: 'events/patients/piper-past-hx.json'
        },
        mira: {
            id: 'mira',
            name: 'Mira Shah',
            room: 'Room 301-B',
            age: 58,
            sex: 'Female',
            diagnosis: 'Type 2 DM — ACHS accucheck + sliding-scale insulin',
            skills: ['accucheck'],
            vitals: {
                hr: 88,
                bp: '134/80',
                temp: '98.6°F',
                o2: '98% RA',
                pain: '0/10',
                rr: 16
            },
            htmlFile: 'events/patients/mira.html',
            pastHxFile: 'events/patients/mira-past-hx.json'
        },
        reed: {
            id: 'reed',
            name: 'Reed Vargas',
            room: 'Room 300-A',
            age: 64,
            sex: 'Male',
            diagnosis: 'NSTEMI — heparin drip titration',
            skills: ['iv-check'],
            vitals: {
                hr: 90,
                bp: '128/76',
                temp: '98.4°F',
                o2: '97% RA',
                pain: '2/10 chest',
                rr: 16
            },
            htmlFile: 'events/patients/reed.html',
            pastHxFile: 'events/patients/reed-past-hx.json'
        },
        sloane: {
            id: 'sloane',
            name: 'Sloane Rivera',
            room: 'Room 299-A',
            age: 47,
            sex: 'Female',
            diagnosis: 'New admission — cellulitis (ED transfer)',
            skills: ['admission'],
            vitals: {
                hr: 94,
                bp: '138/86',
                temp: '100.2°F',
                o2: '97% RA',
                pain: '5/10 leg',
                rr: 18
            },
            htmlFile: 'events/patients/sloane.html',
            pastHxFile: 'events/patients/sloane-past-hx.json'
        },
        opal: {
            id: 'opal',
            name: 'Opal Finch',
            room: 'Room 298-B',
            age: 72,
            sex: 'Female',
            diagnosis: 'C. difficile colitis — contact precautions',
            skills: ['isolation-ppe'],
            vitals: {
                hr: 96,
                bp: '118/70',
                temp: '100.4°F',
                o2: '97% RA',
                pain: '3/10 abdomen',
                rr: 18
            },
            htmlFile: 'events/patients/opal.html',
            pastHxFile: 'events/patients/opal-past-hx.json'
        },
        ned: {
            id: 'ned',
            name: 'Ned Brooks',
            room: 'Room 297-A',
            age: 69,
            sex: 'Male',
            diagnosis: 'Acute diarrhea — C. diff PCR pending',
            skills: ['hand-hygiene'],
            vitals: {
                hr: 90,
                bp: '122/74',
                temp: '99.6°F',
                o2: '98% RA',
                pain: '2/10 abdomen',
                rr: 16
            },
            htmlFile: 'events/patients/ned.html',
            pastHxFile: 'events/patients/ned-past-hx.json'
        },
        iris: {
            id: 'iris',
            name: 'Iris Patel',
            room: 'Room 296-B',
            age: 84,
            sex: 'Female',
            diagnosis: 'Syncope workup — high fall risk',
            skills: ['fall-precautions'],
            vitals: {
                hr: 72,
                bp: '108/62',
                temp: '98.2°F',
                o2: '97% RA',
                pain: '1/10',
                rr: 14
            },
            htmlFile: 'events/patients/iris.html',
            pastHxFile: 'events/patients/iris-past-hx.json'
        },
        tessa: {
            id: 'tessa',
            name: 'Tessa Quinn',
            room: 'Room 295-A',
            age: 76,
            sex: 'Female',
            diagnosis: 'UTI with new confusion — possible sepsis',
            skills: ['sepsis-recognition'],
            careSchedules: ['sepsisScreenQ4h'],
            careReason: 'Infection risk — Q4H sepsis screen with VS / systems / labs',
            vitals: {
                hr: 118,
                bp: '88/54',
                temp: '101.8°F',
                o2: '94% RA',
                pain: '2/10',
                rr: 24
            },
            htmlFile: 'events/patients/tessa.html',
            pastHxFile: 'events/patients/tessa-past-hx.json'
        },
        knox: {
            id: 'knox',
            name: 'Knox Hale',
            room: 'ICU-4',
            age: 67,
            sex: 'Male',
            diagnosis: 'Post-MI — unstable VT / Code Blue risk',
            skills: ['code-blue-response'],
            vitals: {
                hr: 140,
                bp: '78/46',
                temp: '98.6°F',
                o2: '92% on NRB',
                pain: 'chest pressure',
                rr: 28
            },
            htmlFile: 'events/patients/knox.html',
            pastHxFile: 'events/patients/knox-past-hx.json'
        },
        blair: {
            id: 'blair',
            name: 'Blair Estes',
            room: 'Room 298-A',
            age: 58,
            sex: 'Female',
            diagnosis: 'Post-op day 1 colectomy — new O2 need',
            skills: ['sbar'],
            vitals: {
                hr: 108,
                bp: '98/62',
                temp: '100.4°F',
                o2: '91% → 2 L NC',
                pain: '5/10 abdomen',
                rr: 22
            },
            htmlFile: 'events/patients/blair.html',
            pastHxFile: 'events/patients/blair-past-hx.json'
        },
        clyde: {
            id: 'clyde',
            name: 'Clyde Mercer',
            room: 'Tele-3',
            age: 71,
            sex: 'Male',
            diagnosis: 'New AFib with RVR — telemetry',
            skills: ['ecg-basics'],
            vitals: {
                hr: 128,
                bp: '108/70',
                temp: '98.4°F',
                o2: '96% RA',
                pain: '0/10',
                rr: 18
            },
            htmlFile: 'events/patients/clyde.html',
            pastHxFile: 'events/patients/clyde-past-hx.json'
        },
        vera: {
            id: 'vera',
            name: 'Vera Holcomb',
            room: 'Room 299-A',
            age: 64,
            sex: 'Female',
            diagnosis: 'POD 2 total knee — VTE risk high',
            skills: ['dvt-prophylaxis'],
            vitals: {
                hr: 86,
                bp: '128/78',
                temp: '98.8°F',
                o2: '97% RA',
                pain: '4/10 knee',
                rr: 16
            },
            htmlFile: 'events/patients/vera.html',
            pastHxFile: 'events/patients/vera-past-hx.json'
        },
        hugh: {
            id: 'hugh',
            name: 'Hugh Prater',
            room: 'Room 300-A',
            age: 72,
            sex: 'Male',
            diagnosis: 'CHF exacerbation — strict I&O',
            skills: ['fluid-balance'],
            vitals: {
                hr: 94,
                bp: '142/86',
                temp: '98.2°F',
                o2: '93% 2 L NC',
                pain: '1/10',
                rr: 22
            },
            htmlFile: 'events/patients/hugh.html',
            pastHxFile: 'events/patients/hugh-past-hx.json'
        },
        dolly: {
            id: 'dolly',
            name: 'Dolly Raines',
            room: 'Room 301-A',
            age: 66,
            sex: 'Female',
            diagnosis: 'ESRD — left AV fistula, HD M/W/F',
            skills: ['dialysis-access'],
            vitals: {
                hr: 82,
                bp: '148/88',
                temp: '98.4°F',
                o2: '98% RA',
                pain: '0/10',
                rr: 16
            },
            htmlFile: 'events/patients/dolly.html',
            pastHxFile: 'events/patients/dolly-past-hx.json'
        },
        pearl: {
            id: 'pearl',
            name: 'Pearl Voss',
            room: 'Room 302-A',
            age: 41,
            sex: 'Female',
            diagnosis: 'Major depressive episode — suicide precautions',
            skills: ['suicide-precautions'],
            vitals: {
                hr: 88,
                bp: '118/72',
                temp: '98.2°F',
                o2: '99% RA',
                pain: '2/10 headache',
                rr: 16
            },
            htmlFile: 'events/patients/pearl.html',
            pastHxFile: 'events/patients/pearl-past-hx.json'
        },
        otis: {
            id: 'otis',
            name: 'Otis Greer',
            room: 'Room 303-A',
            age: 79,
            sex: 'Male',
            diagnosis: 'Hip ORIF — acute delirium, soft wrist restraints',
            skills: ['restraint-safety'],
            vitals: {
                hr: 96,
                bp: '132/78',
                temp: '99.0°F',
                o2: '96% RA',
                pain: '3/10 hip',
                rr: 18
            },
            htmlFile: 'events/patients/otis.html',
            pastHxFile: 'events/patients/otis-past-hx.json'
        },
        nina: {
            id: 'nina',
            name: 'Nina Corbett',
            room: 'Room 304-A',
            age: 55,
            sex: 'Female',
            diagnosis: 'HTN / diabetes — scheduled evening meds',
            skills: ['medication-rights'],
            vitals: {
                hr: 78,
                bp: '148/90',
                temp: '98.6°F',
                o2: '98% RA',
                pain: '0/10',
                rr: 14
            },
            htmlFile: 'events/patients/nina.html',
            pastHxFile: 'events/patients/nina-past-hx.json'
        },
        lane: {
            id: 'lane',
            name: 'Lane Broussard',
            room: 'Room 305-A',
            age: 63,
            sex: 'Male',
            diagnosis: 'Digoxin therapy — critical K+ called',
            skills: ['critical-labs'],
            vitals: {
                hr: 52,
                bp: '108/64',
                temp: '98.4°F',
                o2: '97% RA',
                pain: '0/10',
                rr: 14
            },
            htmlFile: 'events/patients/lane.html',
            pastHxFile: 'events/patients/lane-past-hx.json'
        },
        roy: {
            id: 'roy',
            name: 'Roy Haskins',
            room: 'Room 306-A',
            age: 74,
            sex: 'Male',
            diagnosis: 'TURP — continuous bladder irrigation (CBI)',
            skills: ['cbi'],
            vitals: {
                hr: 88,
                bp: '128/76',
                temp: '98.6°F',
                o2: '97% RA',
                pain: 'bladder spasms 4/10',
                rr: 16
            },
            htmlFile: 'events/patients/roy.html',
            pastHxFile: 'events/patients/roy-past-hx.json'
        },
        axel: {
            id: 'axel',
            name: 'Axel Moreau',
            room: 'ICU-5',
            age: 48,
            sex: 'Male',
            diagnosis: 'Refractory cardiogenic shock — VA ECMO',
            skills: ['ecmo'],
            vitals: {
                hr: 90,
                bp: 'MAP 68',
                temp: '36.8°C',
                o2: 'vent + ECMO',
                pain: 'sedated',
                rr: 'vent'
            },
            htmlFile: 'events/patients/axel.html',
            pastHxFile: 'events/patients/axel-past-hx.json'
        },
        beau: {
            id: 'beau',
            name: 'Beau Langford',
            room: 'ICU-6',
            age: 61,
            sex: 'Male',
            diagnosis: 'Cardiogenic shock — femoral IABP 1:1',
            skills: ['iabp'],
            vitals: {
                hr: 102,
                bp: '86/54',
                temp: '98.2°F',
                o2: '94% 4 L NC',
                pain: 'chest pressure 3/10',
                rr: 22
            },
            htmlFile: 'events/patients/beau.html',
            pastHxFile: 'events/patients/beau-past-hx.json'
        },
        cade: {
            id: 'cade',
            name: 'Cade Orman',
            room: 'ICU-7',
            age: 58,
            sex: 'Male',
            diagnosis: 'Septic AKI — CRRT (CVVHDF)',
            skills: ['crrt'],
            vitals: {
                hr: 112,
                bp: '92/54',
                temp: '100.8°F',
                o2: 'vent',
                pain: 'sedated',
                rr: 'vent'
            },
            htmlFile: 'events/patients/cade.html',
            pastHxFile: 'events/patients/cade-past-hx.json'
        },
        drew: {
            id: 'drew',
            name: 'Drew Pell',
            room: 'ICU-8',
            age: 69,
            sex: 'Male',
            diagnosis: 'Acute MI — cardiogenic shock (CGS)',
            skills: ['cgs'],
            vitals: {
                hr: 118,
                bp: '78/50',
                temp: '97.8°F',
                o2: '90% NRB',
                pain: 'chest 5/10',
                rr: 28
            },
            htmlFile: 'events/patients/drew.html',
            pastHxFile: 'events/patients/drew-past-hx.json'
        },
        elio: {
            id: 'elio',
            name: 'Elio Varga',
            room: 'ICU-9',
            age: 52,
            sex: 'Male',
            diagnosis: 'ARDS — cisatracurium drip; TOF monitoring',
            skills: ['tof-assessment'],
            vitals: {
                hr: 96,
                bp: '108/62',
                temp: '99.1°F',
                o2: 'vent',
                pain: 'sedated / NMB',
                rr: 'vent'
            },
            htmlFile: 'events/patients/elio.html',
            pastHxFile: 'events/patients/elio-past-hx.json'
        },
        finn: {
            id: 'finn',
            name: 'Finn Okada',
            room: 'ICU-10',
            age: 71,
            sex: 'Male',
            diagnosis: 'Symptomatic bradycardia — temporary transvenous pacemaker',
            skills: ['pacemaker-trans'],
            vitals: {
                hr: 70,
                bp: '102/64',
                temp: '98.4°F',
                o2: '96% 2 L NC',
                pain: 'insertion site 2/10',
                rr: 16
            },
            htmlFile: 'events/patients/finn.html',
            pastHxFile: 'events/patients/finn-past-hx.json'
        },
        glen: {
            id: 'glen',
            name: 'Glen Vargas',
            room: 'ICU-14',
            age: 59,
            sex: 'Male',
            diagnosis: 'Esophageal variceal bleed — Protonix + Sandostatin drips',
            skills: ['protonix-drip', 'sandostatin-drip'],
            vitals: {
                hr: 118,
                bp: '92/54',
                temp: '98.2°F',
                o2: '96% 2 L NC',
                pain: 'abdomen 3/10',
                rr: 22
            },
            htmlFile: 'events/patients/glen.html',
            pastHxFile: 'events/patients/glen-past-hx.json'
        },
        gwen: {
            id: 'gwen',
            name: 'Gwen Ibarra',
            room: 'Room 307-A',
            age: 68,
            sex: 'Female',
            diagnosis: 'Urinary retention — Foley insertion ordered',
            skills: ['foley-insertion'],
            vitals: {
                hr: 92,
                bp: '138/84',
                temp: '99.0°F',
                o2: '98% RA',
                pain: 'bladder pressure 6/10',
                rr: 18
            },
            htmlFile: 'events/patients/gwen.html',
            pastHxFile: 'events/patients/gwen-past-hx.json'
        },
        harp: {
            id: 'harp',
            name: 'Harp Delgado',
            room: 'Room 308-A',
            age: 59,
            sex: 'Male',
            diagnosis: 'Small bowel obstruction — NGT insertion ordered',
            skills: ['ngt-insertion'],
            vitals: {
                hr: 104,
                bp: '118/70',
                temp: '99.2°F',
                o2: '97% RA',
                pain: 'abdomen 7/10',
                rr: 20
            },
            htmlFile: 'events/patients/harp.html',
            pastHxFile: 'events/patients/harp-past-hx.json'
        },
        hector: {
            id: 'hector',
            name: 'Hector Rivas',
            room: 'Tele-6',
            age: 67,
            sex: 'Male',
            diagnosis: 'Acute decompensated HF — continuous Lasix drip',
            skills: ['lasix-drip'],
            vitals: {
                hr: 98,
                bp: '148/88',
                temp: '98.4°F',
                o2: '93% 3 L NC',
                pain: '0/10',
                rr: 24
            },
            htmlFile: 'events/patients/hector.html',
            pastHxFile: 'events/patients/hector-past-hx.json'
        },
        ida: {
            id: 'ida',
            name: 'Ida Cho',
            room: 'Room 309-A',
            age: 54,
            sex: 'Female',
            diagnosis: 'Osteomyelitis — right PICC; dressing due',
            skills: ['picc-dressing'],
            vitals: {
                hr: 84,
                bp: '126/78',
                temp: '99.4°F',
                o2: '98% RA',
                pain: 'leg 3/10',
                rr: 16
            },
            htmlFile: 'events/patients/ida.html',
            pastHxFile: 'events/patients/ida-past-hx.json'
        },
        cal: {
            id: 'cal',
            name: 'Cal Renner',
            room: 'Room 312-B',
            age: 61,
            sex: 'Male',
            diagnosis: 'Osteomyelitis — right PICC; alteplase (Cathflo) for occlusion risk',
            skills: ['alteplase'],
            weightKg: 72,
            vitals: {
                hr: 86,
                bp: '132/76',
                temp: '99.1°F',
                o2: '97% RA',
                pain: 'leg 2/10',
                rr: 16
            },
            htmlFile: 'events/patients/cal.html',
            pastHxFile: 'events/patients/cal-past-hx.json'
        },
        joss: {
            id: 'joss',
            name: 'Joss Kearney',
            room: 'Room 310-A',
            age: 45,
            sex: 'Female',
            diagnosis: 'Dehydration / gastroenteritis — PIV needed',
            skills: ['iv-insertion'],
            vitals: {
                hr: 108,
                bp: '98/60',
                temp: '100.2°F',
                o2: '98% RA',
                pain: 'abdomen 4/10',
                rr: 18
            },
            htmlFile: 'events/patients/joss.html',
            pastHxFile: 'events/patients/joss-past-hx.json'
        },
        kia: {
            id: 'kia',
            name: 'Kia Brennan',
            room: 'Room 311-A',
            age: 62,
            sex: 'Female',
            diagnosis: 'Rule-out PE — CT angio with IV contrast scheduled',
            skills: ['ct-contrast-iv'],
            vitals: {
                hr: 110,
                bp: '128/80',
                temp: '98.8°F',
                o2: '93% 3 L NC',
                pain: 'chest 4/10',
                rr: 24
            },
            htmlFile: 'events/patients/kia.html',
            pastHxFile: 'events/patients/kia-past-hx.json'
        },
        lita: {
            id: 'lita',
            name: 'Lita Moreno',
            room: 'Room 312-A',
            age: 70,
            sex: 'Female',
            diagnosis: 'Mixed wounds — partial-thickness ulcer + perineal MASD',
            skills: ['wound-change'],
            vitals: {
                hr: 86,
                bp: '132/78',
                temp: '98.6°F',
                o2: '97% RA',
                pain: 'wound 5/10',
                rr: 16
            },
            htmlFile: 'events/patients/lita.html',
            pastHxFile: 'events/patients/lita-past-hx.json'
        },
        milo: {
            id: 'milo',
            name: 'Milo Trent',
            room: 'ICU-11',
            age: 67,
            sex: 'Male',
            diagnosis: 'Acute ischemic stroke — NIHSS serial exams',
            skills: ['nihss'],
            vitals: {
                hr: 88,
                bp: '168/94',
                temp: '98.4°F',
                o2: '97% RA',
                pain: '0/10',
                rr: 16
            },
            htmlFile: 'events/patients/milo.html',
            pastHxFile: 'events/patients/milo-past-hx.json'
        },
        noa: {
            id: 'noa',
            name: 'Noa Ellison',
            room: 'Room 313-A',
            age: 56,
            sex: 'Female',
            diagnosis: 'ESRD — CAPD exchange due',
            skills: ['peritoneal-dialysis'],
            vitals: {
                hr: 78,
                bp: '152/90',
                temp: '98.8°F',
                o2: '98% RA',
                pain: '0/10',
                rr: 16
            },
            htmlFile: 'events/patients/noa.html',
            pastHxFile: 'events/patients/noa-past-hx.json'
        },
        orin: {
            id: 'orin',
            name: 'Orin Vale',
            room: 'Room 314-A',
            age: 61,
            sex: 'Male',
            diagnosis: 'New ESRD — first hemodialysis pending',
            skills: ['new-dialysis-start'],
            vitals: {
                hr: 94,
                bp: '168/96',
                temp: '98.6°F',
                o2: '96% RA',
                pain: '1/10',
                rr: 18
            },
            htmlFile: 'events/patients/orin.html',
            pastHxFile: 'events/patients/orin-past-hx.json'
        },
        paige: {
            id: 'paige',
            name: 'Paige Rourke',
            room: 'Room 315-A',
            age: 49,
            sex: 'Female',
            diagnosis: 'Cholecystectomy AM — preop checklist',
            skills: ['surgery-preop'],
            vitals: {
                hr: 76,
                bp: '124/72',
                temp: '98.2°F',
                o2: '99% RA',
                pain: 'RUQ 3/10',
                rr: 14
            },
            htmlFile: 'events/patients/paige.html',
            pastHxFile: 'events/patients/paige-past-hx.json'
        },
        quin: {
            id: 'quin',
            name: 'Quin Asher',
            room: 'ICU-12',
            age: 58,
            sex: 'Male',
            diagnosis: 'PE — heparin drip with aPTT protocol',
            skills: ['heparin-drip'],
            vitals: {
                hr: 102,
                bp: '118/72',
                temp: '98.6°F',
                o2: '94% 2 L NC',
                pain: '2/10',
                rr: 20
            },
            htmlFile: 'events/patients/quin.html',
            pastHxFile: 'events/patients/quin-past-hx.json'
        },
        rhea: {
            id: 'rhea',
            name: 'Rhea Santos',
            room: 'Room 316-A',
            age: 73,
            sex: 'Female',
            diagnosis: 'Post-op urinary retention — bladder scan q6h',
            skills: ['bladder-scan'],
            vitals: {
                hr: 84,
                bp: '130/76',
                temp: '98.6°F',
                o2: '98% RA',
                pain: 'incision 3/10',
                rr: 16
            },
            htmlFile: 'events/patients/rhea.html',
            pastHxFile: 'events/patients/rhea-past-hx.json'
        },
        sage: {
            id: 'sage',
            name: 'Sage Whitfield',
            room: 'ICU-13',
            age: 44,
            sex: 'Female',
            diagnosis: 'DKA — IV insulin drip',
            skills: ['insulin-drip'],
            vitals: {
                hr: 118,
                bp: '108/64',
                temp: '99.0°F',
                o2: '97% RA',
                pain: '1/10',
                rr: 26
            },
            htmlFile: 'events/patients/sage.html',
            pastHxFile: 'events/patients/sage-past-hx.json'
        },
        tate: {
            id: 'tate',
            name: 'Tate Brennan',
            room: 'ICU-14',
            age: 66,
            sex: 'Male',
            diagnosis: 'AFib with RVR — IV amiodarone drip',
            skills: ['amiodarone-drip'],
            vitals: {
                hr: 142,
                bp: '98/60',
                temp: '98.4°F',
                o2: '95% 2 L NC',
                pain: '0/10',
                rr: 20
            },
            htmlFile: 'events/patients/tate.html',
            pastHxFile: 'events/patients/tate-past-hx.json'
        },
        uma: {
            id: 'uma',
            name: 'Uma Kessler',
            room: 'ICU-15',
            age: 39,
            sex: 'Female',
            diagnosis: 'SAH — EVD in place',
            skills: ['evd'],
            vitals: {
                hr: 78,
                bp: 'MAP 90',
                temp: '37.2°C',
                o2: 'vent',
                pain: 'sedated',
                rr: 'vent'
            },
            htmlFile: 'events/patients/uma.html',
            pastHxFile: 'events/patients/uma-past-hx.json'
        },
        wynn: {
            id: 'wynn',
            name: 'Wynn Calder',
            room: 'ICU-16',
            age: 62,
            sex: 'Male',
            diagnosis: 'Cardiogenic shock — PA catheter / thermodilution CI',
            skills: ['cardiac-index'],
            vitals: {
                hr: 108,
                bp: '86/52',
                temp: '36.9°C',
                o2: 'vent',
                pain: 'sedated',
                rr: 'vent'
            },
            htmlFile: 'events/patients/wynn.html',
            pastHxFile: 'events/patients/wynn-past-hx.json'
        },
        yara: {
            id: 'yara',
            name: 'Yara Mendel',
            room: 'Room 317-A',
            age: 51,
            sex: 'Female',
            diagnosis: 'New end ileostomy — pouch ⅓–½ full',
            skills: ['ileostomy-emptying'],
            vitals: {
                hr: 82,
                bp: '122/74',
                temp: '98.6°F',
                o2: '98% RA',
                pain: 'incision 3/10',
                rr: 16
            },
            htmlFile: 'events/patients/yara.html',
            pastHxFile: 'events/patients/yara-past-hx.json'
        },
        zane: {
            id: 'zane',
            name: 'Zane Ortiz',
            room: 'Room 318-A',
            age: 57,
            sex: 'Male',
            diagnosis: 'End ileostomy — wafer leaking; bag change due',
            skills: ['ileostomy-bag-change'],
            vitals: {
                hr: 80,
                bp: '128/78',
                temp: '98.4°F',
                o2: '98% RA',
                pain: 'peristomal sting 4/10',
                rr: 16
            },
            htmlFile: 'events/patients/zane.html',
            pastHxFile: 'events/patients/zane-past-hx.json'
        },
        bron: {
            id: 'bron',
            name: 'Bron Yates',
            room: 'Room 319-A',
            age: 34,
            sex: 'Male',
            diagnosis: 'Femur fracture — skeletal traction with pin & hanging weights',
            skills: ['skeletal-traction'],
            vitals: {
                hr: 88,
                bp: '128/76',
                temp: '98.6°F',
                o2: '98% RA',
                pain: 'leg 5/10',
                rr: 16
            },
            htmlFile: 'events/patients/bron.html',
            pastHxFile: 'events/patients/bron-past-hx.json'
        },
        cory: {
            id: 'cory',
            name: 'Cory Lam',
            room: 'Room 320-A',
            age: 29,
            sex: 'Male',
            diagnosis: 'Tibial fracture — external fixator; pin care due',
            skills: ['pin-care'],
            vitals: {
                hr: 86,
                bp: '122/74',
                temp: '99.0°F',
                o2: '98% RA',
                pain: 'leg 4/10',
                rr: 16
            },
            htmlFile: 'events/patients/cory.html',
            pastHxFile: 'events/patients/cory-past-hx.json'
        },
        dex: {
            id: 'dex',
            name: 'Dex Harlan',
            room: 'Tele-4',
            age: 58,
            sex: 'Male',
            diagnosis: 'Chest pain — 12-lead EKG ordered',
            skills: ['ekg-12-lead'],
            vitals: {
                hr: 96,
                bp: '148/88',
                temp: '98.4°F',
                o2: '97% RA',
                pain: 'chest 4/10',
                rr: 18
            },
            htmlFile: 'events/patients/dex.html',
            pastHxFile: 'events/patients/dex-past-hx.json'
        },
        vale: {
            id: 'vale',
            name: 'Vale Ortiz',
            room: 'ICU-17',
            age: 64,
            sex: 'Female',
            diagnosis: 'COPD exacerbation — hypercapnic respiratory failure; serial ABGs',
            skills: ['abg'],
            careSchedules: ['turnQ2h'],
            careReason: 'Fatigued on BiPAP — limited self-repositioning',
            vitals: {
                hr: 108,
                bp: '142/86',
                temp: '99.1°F',
                o2: '91% BiPAP',
                pain: '2/10',
                rr: 28
            },
            htmlFile: 'events/patients/vale.html',
            pastHxFile: 'events/patients/vale-past-hx.json'
        },
        remy: {
            id: 'remy',
            name: 'Remy Castillo',
            room: 'ICU-18',
            age: 57,
            sex: 'Male',
            diagnosis: 'Septic shock — left radial arterial line for continuous BP / ABG access',
            skills: ['arterial-line'],
            vitals: {
                hr: 118,
                bp: '86/48 MAP 61',
                temp: '101.4°F',
                o2: '93% 6L NC',
                pain: '3/10',
                rr: 26
            },
            htmlFile: 'events/patients/remy.html',
            pastHxFile: 'events/patients/remy-past-hx.json'
        },
        nell: {
            id: 'nell',
            name: 'Nell Parkhurst',
            room: 'Room 322-A',
            age: 71,
            sex: 'Female',
            diagnosis: 'CHF exacerbation — bilateral edema; full shift physical assessment',
            skills: ['heart-sounds', 'lung-sounds', 'capillary-refill', 'swelling'],
            vitals: {
                hr: 94,
                bp: '152/88',
                temp: '98.4°F',
                o2: '94% 2L NC',
                pain: '3/10',
                rr: 22
            },
            htmlFile: 'events/patients/nell.html',
            pastHxFile: 'events/patients/nell-past-hx.json'
        },
        nova: {
            id: 'nova',
            name: 'Nova Ellison',
            room: 'ICU-21',
            age: 61,
            sex: 'Female',
            diagnosis: 'Septic shock — Levophed/vaso/Neo + dopamine/dobutamine',
            skills: [
                'vasopressors',
                'levophed-drip',
                'vasopressin-drip',
                'neosynephrine-drip',
                'dopamine-drip',
                'dobutamine-drip'
            ],
            vitals: {
                hr: 124,
                bp: '82/48 MAP 59',
                temp: '101.8°F',
                o2: 'vent',
                pain: 'sedated',
                rr: 'vent'
            },
            htmlFile: 'events/patients/nova.html',
            pastHxFile: 'events/patients/nova-past-hx.json'
        },
        sol: {
            id: 'sol',
            name: 'Sol Marchetti',
            room: 'ICU-22',
            age: 48,
            sex: 'Male',
            diagnosis: 'ARDS — propofol/Precedex/fentanyl/morphine + cisatracurium TOF',
            skills: [
                'icu-sedation',
                'propofol-drip',
                'precedex-drip',
                'fentanyl-drip',
                'morphine-drip',
                'tof-assessment'
            ],
            vitals: {
                hr: 88,
                bp: '102/58',
                temp: '99.4°F',
                o2: 'vent',
                pain: 'sedated / NMB',
                rr: 'vent'
            },
            htmlFile: 'events/patients/sol.html',
            pastHxFile: 'events/patients/sol-past-hx.json'
        },
        haven: {
            id: 'haven',
            name: 'Haven Ortiz',
            room: 'ICU-23',
            age: 72,
            sex: 'Male',
            diagnosis: 'Known AAA 5.8 cm — sudden back/abdominal pain',
            skills: ['aaa'],
            vitals: {
                hr: 122,
                bp: '86/50',
                temp: '98.4°F',
                o2: '94% NC 2 L',
                pain: '9/10 tearing back',
                rr: 26
            },
            htmlFile: 'events/patients/haven.html',
            pastHxFile: 'events/patients/haven-past-hx.json'
        },
        keira: {
            id: 'keira',
            name: 'Keira Dunne',
            room: 'Room 412-B',
            age: 58,
            sex: 'Female',
            diagnosis: 'POD 3 total hip — sudden dyspnea / possible PE',
            skills: ['pulmonary-embolism'],
            vitals: {
                hr: 124,
                bp: '102/68',
                temp: '99.1°F',
                o2: '88% RA',
                pain: 'pleuritic 7/10',
                rr: 28
            },
            htmlFile: 'events/patients/keira.html',
            pastHxFile: 'events/patients/keira-past-hx.json'
        },
        tovah: {
            id: 'tovah',
            name: 'Tovah Brink',
            room: 'Room 318-A',
            age: 67,
            sex: 'Male',
            diagnosis: 'Cold pale left leg — arterial vs venous clot workup',
            skills: ['peripheral-clot'],
            vitals: {
                hr: 96,
                bp: '148/86',
                temp: '98.6°F',
                o2: '97% RA',
                pain: '8/10 left foot',
                rr: 18
            },
            htmlFile: 'events/patients/tovah.html',
            pastHxFile: 'events/patients/tovah-past-hx.json'
        }
    };

    let panelMode = 'patient'; // 'patient' | 'global'

    function addMinutesToHhmm(hhmm, minutes) {
        const n = Number(hhmm);
        const base = Number.isFinite(n) ? n : 0;
        const total = Math.floor(base / 100) * 60 + (base % 100) + Number(minutes);
        const day = ((total % 1440) + 1440) % 1440;
        return Math.floor(day / 60) * 100 + (day % 60);
    }

    /** Chevron after the section title (not leading) — FA caret, rotated when collapsed. */
    function ensureSectionChevron(heading) {
        if (!heading || heading.querySelector(':scope > .task-section-chevron')) return;
        heading.classList.add('task-section-heading');
        const chevron = document.createElement('span');
        chevron.className = 'task-section-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.innerHTML = '<i class="fas fa-chevron-down"></i>';
        const before = heading.querySelector(':scope > .task-section-help, :scope > .task-fallout-toggle');
        if (before) heading.insertBefore(chevron, before);
        else heading.appendChild(chevron);
    }

    function syncSectionExpanded(heading, bodyEl) {
        if (!heading || !bodyEl) return;
        const expanded = !bodyEl.classList.contains('hidden');
        heading.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        heading.classList.toggle('is-collapsed', !expanded);
    }

    function wireSectionToggle(heading, bodyEl, onExpand) {
        if (!heading || !bodyEl) return;
        ensureSectionChevron(heading);
        syncSectionExpanded(heading, bodyEl);
        if (heading.dataset.sectionToggleBound === '1') return;
        heading.dataset.sectionToggleBound = '1';
        heading.addEventListener('click', (e) => {
            if (e.target.closest('.task-section-help, .task-fallout-toggle')) return;
            e.preventDefault();
            bodyEl.classList.toggle('hidden');
            syncSectionExpanded(heading, bodyEl);
            if (typeof onExpand === 'function' && !bodyEl.classList.contains('hidden')) {
                onExpand();
            }
        });
        heading.removeAttribute('onclick');
    }

    function ensureMedWindowHelp(heading) {
        if (!heading || heading.querySelector(':scope > .task-section-help')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'task-section-help';
        btn.setAttribute('aria-label', 'Medication time window help');
        btn.title = 'When can I give medications?';
        btn.textContent = '?';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            taskSystem.showMedicationWindowHelp?.();
        });
        const fallout = heading.querySelector(':scope > .task-fallout-toggle');
        if (fallout) heading.insertBefore(btn, fallout);
        else heading.appendChild(btn);
    }

    function decoratePatientSectionHeadings(patientElement, patient = null) {
        if (!patientElement) return;
        patientElement.querySelectorAll('h4').forEach((heading) => {
            let body = heading.nextElementSibling;
            if (!body) return;
            // Skip note paragraphs between heading and the collapsible list
            if (body.matches('p') && body.nextElementSibling?.matches('ul')) {
                body = body.nextElementSibling;
            }
            const isToggleable = heading.hasAttribute('onclick')
                || heading.classList.contains('past-hx-toggle')
                || heading.classList.contains('task-section-heading')
                || heading.dataset.sectionToggleBound === '1'
                || body.matches('ul, .past-hx-panel');
            if (!isToggleable) return;

            const onExpand = heading.classList.contains('past-hx-toggle') && patient
                ? () => {
                    const mount = body.querySelector('[data-past-hx-mount]') || body;
                    ensurePastHxTimeline(patient.id, mount, patient.pastHxPack || {
                        displayName: patient.name,
                        pastHx: patient.pastHx || []
                    });
                }
                : null;

            wireSectionToggle(heading, body, onExpand);

            const label = heading.textContent || '';
            if (body.classList.contains('meds-list') || /medications/i.test(label)) {
                ensureMedWindowHelp(heading);
            }
        });
    }

    function resolveCareScheduleKeys(patientConfig, html) {
        const keys = new Set(
            Array.isArray(patientConfig.careSchedules) ? patientConfig.careSchedules : []
        );
        let careReason = patientConfig.careReason || null;
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const root = doc.querySelector('.patient[data-care-schedule], [data-care-schedule]');
            const raw = root?.getAttribute('data-care-schedule') || '';
            const schedules = GameConfig.careSchedules || {};
            raw.split(/[,\s]+/).filter(Boolean).forEach((token) => {
                const match = Object.entries(schedules).find(
                    ([, cfg]) => cfg.htmlAttr === token || cfg.id === token
                );
                if (match) keys.add(match[0]);
                else if (schedules[token]) keys.add(token);
            });
            const reason = root?.getAttribute('data-care-reason');
            if (reason) careReason = reason;
        } catch {
            /* ignore parse errors — config keys still apply */
        }
        return { keys: [...keys], careReason };
    }

    function shiftStartHhmm() {
        const pack = gameState.getStateSlice('scenarioPack');
        const start = Number(pack?.shiftStart ?? GameConfig.timer.defaultShiftStart);
        return Number.isFinite(start) ? start : GameConfig.timer.defaultShiftStart;
    }

    function buildCareScheduleTasks(patientId, scheduleKey, careReason) {
        const cfg = GameConfig.careSchedules?.[scheduleKey];
        if (!cfg) return [];
        const shiftStart = shiftStartHhmm();
        const hours = Number(gameState.getStateSlice('scenarioPack')?.shiftDurationHours);
        const shiftMins = Number.isFinite(hours) && hours > 0
            ? hours * 60
            : Number(GameConfig.timer.defaultShiftDuration) || 720;
        const interval = Number(cfg.intervalMins) || 120;
        const tasks = [];
        for (let elapsed = 0; elapsed < shiftMins; elapsed += interval) {
            const scheduled = addMinutesToHhmm(shiftStart, elapsed);
            const meta = {
                kind: cfg.taskKind || scheduleKey || null,
                careSchedule: scheduleKey,
                reason: careReason || null,
                icon: cfg.iconClass || null
            };
            if (cfg.challenge) meta.challenge = cfg.challenge;
            if (cfg.skillId) meta.skillId = cfg.skillId;
            const delegateMode = cfg.delegateMode
                || (scheduleKey === 'turnQ2h' ? 'team' : undefined);
            if (delegateMode) meta.delegateMode = delegateMode;
            tasks.push({
                id: `${patientId}-${scheduleKey}-${String(scheduled).padStart(4, '0')}`,
                name: cfg.taskName || 'Care task',
                type: cfg.taskType || 'assessment',
                taskClass: cfg.taskClass || GameConfig.tasks.classes.ROUTINE,
                scheduled,
                expire: `+${Number(cfg.expireMins) || 60}`,
                durationMins: Number(cfg.durationMins) || 10,
                status: GameConfig.tasks.statuses.NOT_YET,
                metadata: meta
            });
        }
        return tasks;
    }

    /** Bedside shift assessment (first 4h) + chart assessment (after assess, 15 min). */
    function buildShiftAssessmentTasks(patientId) {
        const cfg = GameConfig.shiftAssessment || {};
        const shiftStart = shiftStartHhmm();
        const assessId = `${patientId}-shift-assessment`;
        const chartId = `${patientId}-chart-assessment`;
        const skillPool = Array.isArray(cfg.assessmentSkillIds)
            ? [...cfg.assessmentSkillIds]
            : ['heart-sounds', 'lung-sounds', 'capillary-refill', 'swelling'];
        return [
            {
                id: assessId,
                name: cfg.assessTaskName || 'Shift assessment',
                type: 'assessment',
                taskClass: GameConfig.tasks.classes.URGENT,
                scheduled: shiftStart,
                expire: `+${Number(cfg.assessWithinMins) || 240}`,
                durationMins: Number(cfg.assessDurationMins) || 12,
                status: GameConfig.tasks.statuses.NOT_YET,
                metadata: {
                    kind: 'shift-assessment',
                    challenge: 'skill-mcq',
                    skillPool,
                    icon: 'fas fa-stethoscope'
                }
            },
            {
                id: chartId,
                name: cfg.chartTaskName || 'Chart assessment',
                type: 'assessment',
                taskClass: GameConfig.tasks.classes.ROUTINE,
                scheduled: shiftStart,
                expire: `+${Number(cfg.chartExpireMins) || 480}`,
                durationMins: Number(cfg.chartDurationMins) || 15,
                status: GameConfig.tasks.statuses.NOT_YET,
                metadata: {
                    kind: 'chart-assessment',
                    requiresCompletedTaskId: assessId,
                    icon: 'fas fa-notes-medical'
                }
            }
        ];
    }

    function syncShiftAssessmentLockAttrs(patientId) {
        const assessId = `${patientId}-shift-assessment`;
        const chartEl = document.getElementById(`${patientId}-chart-assessment`);
        if (!chartEl) return;
        const assess = gameState.getStateSlice('tasks')?.get(assessId);
        const unlocked = assess?.status === GameConfig.tasks.statuses.COMPLETED;
        chartEl.setAttribute('data-task-locked', unlocked ? '0' : '1');
        chartEl.title = unlocked
            ? 'Click for Perform / Details menu'
            : 'Locked — complete shift assessment first';
    }

    function mountShiftAssessmentTasks(patientId, shiftTasks) {
        if (!shiftTasks.length) return;
        const panel = document.querySelector(`.patient-panel-host[data-patient-id="${patientId}"]`);
        if (!panel) return;

        let list = panel.querySelector('.shift-assessment-list');
        if (!list) {
            const block = document.createElement('div');
            block.className = 'space-y-2 mb-4 shift-assessment-block';
            const heading = document.createElement('h4');
            heading.className = 'font-semibold flex items-center gap-2 cursor-pointer hover:bg-gray-100 task-section-heading';
            heading.innerHTML = '<i class="fas fa-stethoscope text-xl mr-1 text-sky-700"></i> Shift assessment / charting';
            list = document.createElement('ul');
            list.className = 'shift-assessment-list space-y-3';
            wireSectionToggle(heading, list);
            block.appendChild(heading);
            const note = document.createElement('p');
            note.className = 'text-xs text-gray-600 mb-2';
            note.textContent = 'Assess within first 4 hours (skill check). Chart unlocks after assess (~15 min).';
            block.appendChild(note);
            block.appendChild(list);
            const patientRoot = panel.querySelector('.patient') || panel;
            const vitalsGrid = patientRoot.querySelector('.grid.grid-cols-2');
            if (vitalsGrid?.nextSibling) {
                patientRoot.insertBefore(block, vitalsGrid.nextSibling);
            } else {
                const medsBlock = patientRoot.querySelector('.meds-list')?.closest('.space-y-2.mb-4, .space-y-2');
                if (medsBlock) patientRoot.insertBefore(block, medsBlock);
                else patientRoot.appendChild(block);
            }
        } else {
            list.replaceChildren();
        }

        shiftTasks.forEach((task) => {
            if (document.getElementById(task.id)) return;
            const live = gameState.getStateSlice('tasks').get(task.id) || task;
            const li = document.createElement('li');
            li.id = live.id;
            li.setAttribute('data-task-type', live.type);
            li.setAttribute('data-task-class', live.taskClass || 'routine');
            li.setAttribute('data-status', live.status);
            li.setAttribute('data-scheduled', String(live.scheduled).padStart(4, '0'));
            if (live.metadata?.kind) li.setAttribute('data-task-kind', live.metadata.kind);
            if (live.metadata?.challenge) li.setAttribute('data-challenge', live.metadata.challenge);
            if (live.expire != null) {
                li.setAttribute(
                    'data-expire',
                    typeof live.expire === 'number'
                        ? String(live.expire).padStart(4, '0')
                        : String(live.expire)
                );
            }
            li.setAttribute('data-duration-mins', String(live.duration || 15));
            const locked = live.metadata?.requiresCompletedTaskId
                && gameState.getStateSlice('tasks')?.get(live.metadata.requiresCompletedTaskId)?.status
                    !== GameConfig.tasks.statuses.COMPLETED;
            li.setAttribute('data-task-locked', locked ? '1' : '0');
            li.setAttribute(
                'title',
                locked ? 'Locked — complete shift assessment first' : 'Click for Perform / Details menu'
            );
            li.className = `bg-sky-50 p-4 rounded-lg shadow flex items-center task-status-${live.status} border border-sky-200`;
            const timeLabel = String(live.scheduled).padStart(4, '0');
            const icon = live.metadata?.icon || 'fas fa-stethoscope';
            li.innerHTML = `
              <data class="slot-label" value="1"></data>
              <i class="${icon} text-sky-700 text-xl mr-3"></i>
              <span class="font-medium text-gray-900">${live.name}</span>
              <span class="ml-auto text-sm text-gray-500">${timeLabel.slice(0, 2)}:${timeLabel.slice(2)}</span>
            `;
            list.appendChild(li);
            taskSystem.syncTaskWindowDomAttrs?.(li, live);
        });
        syncShiftAssessmentLockAttrs(patientId);
    }

    /** CNA/CCT solo requests — bathroom, water, bed position, pillow, linen (instant delegate). */
    function buildSoloRequestTasks(patientId, patientIndex = 0) {
        const catalog = GameConfig.delegation?.soloRequestCatalog || [];
        if (!catalog.length) return [];
        const shiftStart = shiftStartHhmm();
        return catalog.map((spec, i) => {
            const scheduled = addMinutesToHhmm(
                shiftStart,
                45 + (Number(patientIndex) || 0) * 20 + i * 55
            );
            return {
                id: `${patientId}-cna-${spec.id}`,
                name: spec.name || 'Patient request',
                type: 'assessment',
                taskClass: GameConfig.tasks.classes.ROUTINE,
                scheduled,
                expire: `+${Number(spec.expireMins) || 60}`,
                durationMins: Number(spec.durationMins) || 5,
                status: GameConfig.tasks.statuses.NOT_YET,
                metadata: {
                    delegateMode: 'solo',
                    cnaRequest: spec.id,
                    icon: spec.icon || 'fas fa-hands-helping'
                }
            };
        });
    }

    function mountSoloRequestTasks(patientId, soloTasks) {
        if (!soloTasks.length) return;
        const panel = document.querySelector(`.patient-panel-host[data-patient-id="${patientId}"]`);
        if (!panel) return;

        let list = panel.querySelector('.care-solo-list');
        if (!list) {
            const block = document.createElement('div');
            block.className = 'space-y-2 mb-4 care-solo-block';
            const heading = document.createElement('h4');
            heading.className = 'font-semibold flex items-center gap-2 cursor-pointer hover:bg-gray-100 task-section-heading';
            heading.innerHTML = '<i class="fas fa-hands-helping text-xl mr-1 text-violet-600"></i> Patient requests (CNA)';
            list = document.createElement('ul');
            list.className = 'care-solo-list space-y-3';
            wireSectionToggle(heading, list);
            block.appendChild(heading);
            const note = document.createElement('p');
            note.className = 'text-xs text-gray-600 mb-2';
            note.textContent = 'Delegate: they do this · instant (bathroom, water, bed position, pillow, linen)';
            block.appendChild(note);
            block.appendChild(list);
            const patientRoot = panel.querySelector('.patient') || panel;
            const vitalsGrid = patientRoot.querySelector('.grid.grid-cols-2');
            if (vitalsGrid?.nextSibling) {
                patientRoot.insertBefore(block, vitalsGrid.nextSibling);
            } else {
                const medsBlock = patientRoot.querySelector('.meds-list')?.closest('.space-y-2.mb-4, .space-y-2');
                if (medsBlock) patientRoot.insertBefore(block, medsBlock);
                else patientRoot.appendChild(block);
            }
        } else {
            list.replaceChildren();
            const heading = list.previousElementSibling;
            if (heading && !panel.querySelector('.care-solo-block .text-xs')) {
                /* keep authored heading */
            }
        }

        soloTasks.forEach((task) => {
            if (document.getElementById(task.id)) return;
            const live = gameState.getStateSlice('tasks').get(task.id) || task;
            const li = document.createElement('li');
            li.id = live.id;
            li.setAttribute('data-task-type', live.type);
            li.setAttribute('data-task-class', live.taskClass || 'routine');
            li.setAttribute('data-status', live.status);
            li.setAttribute('data-scheduled', String(live.scheduled).padStart(4, '0'));
            li.setAttribute('data-delegate-mode', 'solo');
            if (live.expire != null) {
                li.setAttribute(
                    'data-expire',
                    typeof live.expire === 'number'
                        ? String(live.expire).padStart(4, '0')
                        : String(live.expire)
                );
            }
            li.setAttribute('data-duration-mins', String(live.duration || 5));
            li.setAttribute('title', 'Select a CNA then click — they do this · instant');
            li.className = `bg-violet-50 p-4 rounded-lg shadow flex items-center task-status-${live.status} border border-violet-200`;
            const timeLabel = String(live.scheduled).padStart(4, '0');
            const icon = live.metadata?.icon || 'fas fa-hands-helping';
            li.innerHTML = `
              <data class="slot-label" value="1"></data>
              <i class="${icon} text-violet-600 text-xl mr-3"></i>
              <span class="font-medium text-gray-900">${live.name}</span>
              <span class="ml-auto text-sm text-gray-500">${timeLabel.slice(0, 2)}:${timeLabel.slice(2)}</span>
            `;
            list.appendChild(li);
            taskSystem.syncTaskWindowDomAttrs?.(li, live);
        });
    }

    function mountCareScheduleTasks(patientId, careTasks, careReason) {
        if (!careTasks.length) return;
        const panel = document.querySelector(`.patient-panel-host[data-patient-id="${patientId}"]`);
        if (!panel) return;

        const bySchedule = new Map();
        careTasks.forEach((task) => {
            const key = task.metadata?.careSchedule || 'care';
            if (!bySchedule.has(key)) bySchedule.set(key, []);
            bySchedule.get(key).push(task);
        });

        bySchedule.forEach((tasks, scheduleKey) => {
            const cfg = GameConfig.careSchedules?.[scheduleKey] || {};
            const listClass = `care-tasks-list care-tasks-list--${scheduleKey}`;
            let list = panel.querySelector(`.care-tasks-list--${scheduleKey}`);
            if (!list) {
                const block = document.createElement('div');
                block.className = `space-y-2 mb-4 care-tasks-block care-tasks-block--${scheduleKey}`;
                const heading = document.createElement('h4');
                heading.className = 'font-semibold flex items-center gap-2 cursor-pointer hover:bg-gray-100 task-section-heading';
                const icon = cfg.sectionIcon || 'fas fa-bed text-emerald-700';
                const title = cfg.sectionTitle || 'Turning / skin care';
                heading.innerHTML = `<i class="${icon} text-xl mr-1"></i> ${title}`;
                list = document.createElement('ul');
                list.className = `${listClass} space-y-3`;
                wireSectionToggle(heading, list);
                block.appendChild(heading);
                const reasonText = careReason || cfg.careReason || null;
                if (reasonText) {
                    const note = document.createElement('p');
                    note.className = `text-xs text-gray-600 mb-2 care-schedule-reason care-schedule-reason--${scheduleKey}`;
                    note.textContent = reasonText;
                    block.appendChild(note);
                }
                block.appendChild(list);
                const patientRoot = panel.querySelector('.patient') || panel;
                const vitalsGrid = patientRoot.querySelector('.grid.grid-cols-2');
                if (vitalsGrid?.nextSibling) {
                    patientRoot.insertBefore(block, vitalsGrid.nextSibling);
                } else {
                    const medsBlock = patientRoot.querySelector('.meds-list')?.closest('.space-y-2.mb-4, .space-y-2');
                    if (medsBlock) patientRoot.insertBefore(block, medsBlock);
                    else patientRoot.appendChild(block);
                }
            }

            const rowClass = cfg.rowClass || 'bg-emerald-50 border border-emerald-200';
            const iconClass = cfg.iconClass || 'fas fa-bed text-emerald-700';
            const delegateMode = cfg.delegateMode
                || (scheduleKey === 'turnQ2h' ? 'team' : null);

            tasks.forEach((task) => {
                if (document.getElementById(task.id)) return;
                const live = gameState.getStateSlice('tasks').get(task.id) || task;
                const li = document.createElement('li');
                li.id = live.id;
                li.setAttribute('data-task-type', live.type);
                li.setAttribute('data-task-class', live.taskClass || 'routine');
                li.setAttribute('data-status', live.status);
                li.setAttribute('data-scheduled', String(live.scheduled).padStart(4, '0'));
                if (live.expire != null) {
                    li.setAttribute(
                        'data-expire',
                        typeof live.expire === 'number'
                            ? String(live.expire).padStart(4, '0')
                            : String(live.expire)
                    );
                }
                li.setAttribute('data-duration-mins', String(live.duration || 10));
                if (live.metadata?.kind) {
                    li.setAttribute('data-task-kind', String(live.metadata.kind));
                }
                if (live.metadata?.challenge) {
                    li.setAttribute('data-challenge', String(live.metadata.challenge));
                }
                if (live.metadata?.skillId) {
                    li.setAttribute('data-skill-id', String(live.metadata.skillId));
                }
                if (delegateMode) {
                    li.setAttribute('data-delegate-mode', delegateMode);
                }
                li.setAttribute('title', 'Click for Perform / Details menu');
                li.className = `${rowClass} p-4 rounded-lg shadow flex items-center task-status-${live.status}`;
                const timeLabel = String(live.scheduled).padStart(4, '0');
                li.innerHTML = `
                  <data class="slot-label" value="1"></data>
                  <i class="${iconClass} text-xl mr-3"></i>
                  <span class="font-medium text-gray-900">${live.name}</span>
                  <span class="ml-auto text-sm text-gray-500">${timeLabel.slice(0, 2)}:${timeLabel.slice(2)}</span>
                `;
                list.appendChild(li);
                taskSystem.syncTaskWindowDomAttrs?.(li, live);
            });
            decorateSepsisScreenDice(list);
        });
    }

    // Declarative patient initialization
    // options.skipPackTasks — admit spawn: panel only; checklist comes from admission-system
    // options.admissionPhase — 'admitting' | 'admitted' | null
    const initializePatient = async (patientConfig, options = {}) => {
        try {
            // Load patient HTML template
            const response = await fetch(patientConfig.htmlFile);
            const html = await response.text();
            
            let pastHxPack = { displayName: patientConfig.name, pastHx: [] };
            if (patientConfig.pastHxFile) {
                try {
                    pastHxPack = await loadPastHxPack(patientConfig.pastHxFile);
                    if (!pastHxPack.displayName) {
                        pastHxPack.displayName = patientConfig.name;
                    }
                } catch (pastHxError) {
                    console.warn(`Past hx unavailable for ${patientConfig.id}:`, pastHxError);
                }
            }

            // Pack may raise starting acuity (e.g. ICU assignment)
            const pack = gameState.getStateSlice('scenarioPack');
            const overrides = pack?.patientOverrides?.[patientConfig.id] || {};
            const clinicalStatus = overrides.clinicalStatus || 'stable';
            const acuityScore = Number.isFinite(Number(overrides.acuityScore))
                ? Number(overrides.acuityScore)
                : 0;

            const skipPackTasks = Boolean(options.skipPackTasks);
            const packTasks = extractTasksFromHTML(html, patientConfig.id)
                // Catalog-driven solo requests replace authored CNA linen rows
                .filter((t) => t.metadata?.delegateMode !== 'solo' && !String(t.id).includes('-linen-solo'));
            const { keys: careKeys, careReason } = resolveCareScheduleKeys(patientConfig, html);
            const careTasks = skipPackTasks
                ? []
                : careKeys.flatMap((key) => buildCareScheduleTasks(patientConfig.id, key, careReason));
            const patientIndex = gameState.getStateSlice('patients')?.size || 0;
            const soloTasks = skipPackTasks
                ? []
                : buildSoloRequestTasks(patientConfig.id, patientIndex);
            const shiftTasks = buildShiftAssessmentTasks(patientConfig.id);

            // Create patient data model
            const patient = {
                ...patientConfig,
                careReason,
                tasks: skipPackTasks
                    ? [...shiftTasks]
                    : [...packTasks, ...careTasks, ...soloTasks, ...shiftTasks],
                pastHx: pastHxPack.pastHx || [],
                pastHxPack,
                status: 'active',
                clinicalStatus,
                clinicalStatusReason: overrides.clinicalStatusReason
                    || (options.admissionPhase === 'admitting' ? 'New admission' : null),
                acuityScore,
                admissionPhase: options.admissionPhase || null,
                loadedAt: new Date().toISOString()
            };

            // Register patient in game state
            gameState.dispatch('REGISTER_PATIENT', { patient });

            // Register tasks (shift assessment always; pack/care/solo skipped for mid-shift admits)
            patient.tasks.forEach((taskData) => {
                taskSystem.createTask({
                    ...taskData,
                    patientId: patient.id
                });
            });

            // Render patient in UI (all packs stay mounted; swap via activePatientId)
            renderPatient(patient, html);

            if (skipPackTasks) {
                const panelHost = document.querySelector(
                    `.patient-panel-host[data-patient-id="${patient.id}"]`
                );
                panelHost?.querySelectorAll('[data-task-type]').forEach((el) => el.remove());
            } else {
                if (careTasks.length) {
                    mountCareScheduleTasks(patient.id, careTasks, careReason);
                }
                if (soloTasks.length) {
                    // Drop authored single-linen CNA blocks; remount full catalog
                    const host = document.querySelector(
                        `.patient-panel-host[data-patient-id="${patient.id}"]`
                    );
                    host?.querySelectorAll('.care-solo-list [data-delegate-mode="solo"]').forEach((el) => el.remove());
                    mountSoloRequestTasks(patient.id, soloTasks);
                }
            }
            if (shiftTasks.length) {
                mountShiftAssessmentTasks(patient.id, shiftTasks);
            }

            // E3.M3: write absolute expire (+ resolved) onto DOM for reveal rules / window phase
            syncMountedTaskWindows(patient);
            paintInitialClinicalStatus(patient);

            // IV panel: fluids / IVPB / drips from [data-iv-line]
            const panelHost = document.querySelector(
                `.patient-panel-host[data-patient-id="${patient.id}"]`
            );
            if (panelHost) {
                registerPatientIv(patient.id, panelHost);
            }

            console.log(`Patient ${patient.name} initialized with ${patient.tasks.length} tasks`);
            return patient;
            
        } catch (error) {
            console.error('Failed to initialize patient:', error);
            throw error;
        }
    };

    // Extract tasks from HTML in a declarative way
    const extractTasksFromHTML = (html, patientId) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const taskElements = doc.querySelectorAll('[data-task-type]');
        
        return Array.from(taskElements).map((element, index) => {
            const challenge = element.getAttribute('data-challenge');
            const metadata = {};
            if (challenge) metadata.challenge = challenge;
            const skillId = element.getAttribute('data-skill-id');
            if (skillId) metadata.skillId = skillId;
            const alteplasePhase = element.getAttribute('data-alteplase-phase');
            if (alteplasePhase) metadata.alteplasePhase = alteplasePhase;
            const weightKgAttr = element.getAttribute('data-weight-kg');
            if (weightKgAttr != null && weightKgAttr !== '') {
                const weightKg = Number(weightKgAttr);
                if (Number.isFinite(weightKg)) metadata.weightKg = weightKg;
            }
            const route = element.getAttribute('data-route') || element.getAttribute('data-med-form');
            if (route) metadata.route = route;
            const authoredKind = element.getAttribute('data-task-kind');
            if (authoredKind) metadata.kind = authoredKind;
            if (element.getAttribute('data-iv-drug')) {
                metadata.drug = element.getAttribute('data-iv-drug');
            }
            if (element.getAttribute('data-iv-line-id')) {
                metadata.lineId = element.getAttribute('data-iv-line-id');
            }
            if (element.getAttribute('data-iv-unit')) {
                metadata.unit = element.getAttribute('data-iv-unit');
            }
            if (element.getAttribute('data-iv-rate') != null) {
                metadata.currentRate = Number(element.getAttribute('data-iv-rate'));
            }
            const ivTarget = element.getAttribute('data-target');
            if (ivTarget) metadata.target = ivTarget;
            if (element.getAttribute('data-map') != null) {
                metadata.map = Number(element.getAttribute('data-map'));
            }
            if (element.getAttribute('data-sbp') != null) {
                metadata.sbp = Number(element.getAttribute('data-sbp'));
            }
            const ivDirection = element.getAttribute('data-direction');
            if (ivDirection) metadata.direction = ivDirection;
            const delegateMode = element.getAttribute('data-delegate-mode');
            if (delegateMode) metadata.delegateMode = delegateMode;
            const name = element.querySelector('.font-medium')?.textContent || 'Unknown Task';
            const type = element.getAttribute('data-task-type');
            if (type === 'med' && !metadata.kind) {
                const medKind = inferMedSlotKind({ type, name, metadata });
                if (medKind) metadata.kind = medKind;
            }
            return {
                id: element.id || `${patientId}-task-${index}`,
                name,
                type,
                taskClass: element.getAttribute('data-task-class') || GameConfig.tasks.classes.ROUTINE,
                scheduled: element.getAttribute('data-scheduled'),
                expire: element.getAttribute('data-expire'),
                durationMins: parseInt(element.getAttribute('data-duration-mins')) || 0,
                status: element.getAttribute('data-status') || GameConfig.tasks.statuses.NOT_YET,
                metadata,
                element: element.outerHTML
            };
        });
    };

    // Declarative patient rendering — keep hosts mounted for efficient swap
    const renderPatient = (patient, html) => {
        const patientsContainer = document.querySelector(GameConfig.selectors.patients);
        if (!patientsContainer) {
            console.error('Patients container not found');
            return;
        }

        const host = document.createElement('div');
        host.className = 'patient-panel-host';
        host.setAttribute('data-patient-id', patient.id);
        host.setAttribute('role', 'tabpanel');
        host.innerHTML = html;

        patientsContainer.appendChild(host);
        setupPatientInteractions(patient, host);
    };

    /** Show pack-driven starting acuity on the panel header (ICU etc.). */
    const paintInitialClinicalStatus = (patient) => {
        const status = patient?.clinicalStatus || 'stable';
        if (status === 'stable') return;
        const host = document.querySelector(`.patient-panel-host[data-patient-id="${patient.id}"]`);
        if (!host) return;
        let badge = host.querySelector('[data-clinical-status]');
        if (!badge) {
            const header = host.querySelector('.patient .flex, .patient > div');
            badge = document.createElement('span');
            badge.className = 'text-xs font-semibold px-2 py-0.5 rounded ml-2 clinical-status-badge';
            if (header) header.appendChild(badge);
            else host.prepend(badge);
        }
        badge.setAttribute('data-clinical-status', status);
        badge.textContent = status;
        badge.classList.toggle('is-watch', status === 'watch');
        badge.classList.toggle('is-worsening', status === 'worsening');
        badge.classList.toggle('is-critical', status === 'critical');
    };

    const syncMountedTaskWindows = (patient) => {
        const host = document.querySelector(`.patient-panel-host[data-patient-id="${patient.id}"]`);
        if (!host) return;
        const elements = host.querySelectorAll('[data-task-type]');
        elements.forEach((el, index) => {
            const taskId = el.id || patient.tasks[index]?.id;
            if (!el.id && taskId) el.id = taskId;
            const task = gameState.getStateSlice('tasks')?.get(taskId);
            if (task) {
                taskSystem.syncTaskWindowDomAttrs(el, task);
            }
        });
        SlotSystem.refreshOccupancyMarkers?.();
    };

    const updateCensusMeta = () => {
        const patients = gameState.getStateSlice('patients');
        const count = patients ? patients.size : 0;
        const meta = document.querySelector('#shell-status-meta');
        if (meta) {
            meta.textContent = `Census: ${count} · Slots: 3`;
        }
        const badge = document.querySelector('#census-count-badge');
        if (badge) {
            badge.textContent = String(count);
        }
    };

    /**
     * Mobile census chip: first-name initial + bed letter (Derek Nguyen / 203-A → D.A.).
     * Falls back to first + last initials when room has no bed suffix.
     */
    const abbreviatePatientName = (name, room) => {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        const first = (parts[0] || '?').charAt(0).toUpperCase() || '?';
        const roomStr = String(room || '').replace(/^Room\s+/i, '');
        const bed = roomStr.match(/-([A-Za-z0-9]+)$/i)?.[1];
        if (bed) return `${first}.${String(bed).toUpperCase()}`;
        const last = (parts[parts.length - 1] || '').charAt(0).toUpperCase();
        return last ? `${first}.${last}` : `${first}.`;
    };

    const renderPatientTabs = () => {
        const tabsHost = document.querySelector(GameConfig.selectors.patientTabs);
        if (!tabsHost) return;

        const patients = gameState.getStateSlice('patients');
        const activeId = gameState.getStateSlice('activePatientId');
        tabsHost.innerHTML = '';

        const heading = document.createElement('div');
        heading.className = 'census-tabs-heading';
        heading.innerHTML = `<span>Patients</span><span id="census-count-badge" class="census-count-badge">${patients.size}</span>`;
        tabsHost.appendChild(heading);

        const row = document.createElement('div');
        row.className = 'patient-tabs-row';
        tabsHost.appendChild(row);

        if (!patients.size) {
            const empty = document.createElement('p');
            empty.className = 'census-tabs-empty';
            empty.textContent = 'No patients on census';
            row.appendChild(empty);
        }

        patients.forEach((patient) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'patient-tab';
            btn.setAttribute('role', 'tab');
            btn.dataset.tab = 'patient';
            btn.dataset.patientId = patient.id;
            if (patient.admissionPhase === 'admitting') {
                btn.classList.add('is-admitting');
            }
            const room = (patient.room || '').replace(/^Room\s+/i, '');
            const abbrev = abbreviatePatientName(patient.name, patient.room || room);
            const admitBadge = patient.admissionPhase === 'admitting'
                ? '<span class="patient-tab-admit">Admitting</span>'
                : '';
            btn.title = `${room} ${patient.name}`.trim();
            btn.setAttribute('aria-label', `${room} ${patient.name}`.trim());
            btn.innerHTML = `
              <span class="patient-tab-room">${room}</span>
              <span class="patient-tab-name patient-tab-name--full">${patient.name}</span>
              <span class="patient-tab-name patient-tab-name--abbrev" aria-hidden="true">${abbrev}</span>
              ${admitBadge}`;
            if (panelMode === 'patient' && patient.id === activeId) {
                btn.classList.add('is-active');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.setAttribute('aria-selected', 'false');
            }
            btn.addEventListener('click', () => {
                showPatientPanel(patient.id, {
                    logMessage: `Switched to ${patient.name}`
                });
            });
            row.appendChild(btn);
        });

        const globalBtn = document.createElement('button');
        globalBtn.type = 'button';
        globalBtn.className = 'patient-tab patient-tab--global';
        globalBtn.dataset.tab = 'global';
        globalBtn.setAttribute('role', 'tab');
        globalBtn.innerHTML = `
          <span class="patient-tab-name patient-tab-name--full">Global</span>
          <span class="patient-tab-name patient-tab-name--abbrev" aria-hidden="true">G</span>`;
        if (panelMode === 'global') {
            globalBtn.classList.add('is-active');
            globalBtn.setAttribute('aria-selected', 'true');
        } else {
            globalBtn.setAttribute('aria-selected', 'false');
        }
        globalBtn.addEventListener('click', () => {
            showGlobalPanel();
        });
        row.appendChild(globalBtn);
        updateCensusMeta();
    };

    const applyPanelVisibility = () => {
        const activeId = gameState.getStateSlice('activePatientId');
        const patientsContainer = document.querySelector(GameConfig.selectors.patients);
        const globalPanel = document.querySelector(GameConfig.selectors.globalPanel);

        if (panelMode === 'global') {
            if (patientsContainer) patientsContainer.classList.add('hidden');
            if (globalPanel) {
                globalPanel.classList.remove('hidden');
                // force reflow for transition
                void globalPanel.offsetWidth;
                globalPanel.classList.add('is-active');
            }
            document.querySelectorAll('.patient-panel-host').forEach((host) => {
                host.classList.remove('is-active');
            });
            return;
        }

        if (globalPanel) {
            globalPanel.classList.remove('is-active');
            globalPanel.classList.add('hidden');
        }
        if (patientsContainer) patientsContainer.classList.remove('hidden');

        document.querySelectorAll('.patient-panel-host').forEach((host) => {
            const isActive = host.getAttribute('data-patient-id') === activeId;
            host.classList.toggle('is-active', isActive);
            if (isActive) {
                host.classList.remove('patient-panel-swap');
                void host.offsetWidth;
                host.classList.add('patient-panel-swap');
            }
        });
    };

    // Setup declarative patient interactions
    const setupPatientInteractions = (patient, patientElement) => {
        // Learning UX: medications + IV + turning / CNA care start open so timed work is visible
        patientElement.querySelectorAll('.meds-list, .iv-list, .care-tasks-list, .care-solo-list').forEach((list) => {
            list.classList.remove('hidden');
        });

        // Chevrons + med “?” — replaces legacy inline onclick toggles
        decoratePatientSectionHeadings(patientElement, patient);

        // Task interactions — DOM ids must match extractTasksFromHTML / createTask registry ids
        const taskElements = patientElement.querySelectorAll('[data-task-type]');
        taskElements.forEach((taskElement, index) => {
            if (!taskElement.id) {
                taskElement.id = patient.tasks[index]?.id || `${patient.id}-task-${index}`;
            }
            taskElement.setAttribute('title', 'Click for Perform / Details menu');
            setupTaskInteractions(taskElement, patient);
        });
    };

    // Setup task-specific interactions
    const setupTaskInteractions = (taskElement, patient) => {
        const taskId = taskElement.id;
        const taskType = taskElement.getAttribute('data-task-type');
        
        if (taskType === 'med') {
            setupMedicationTaskInteractions(taskElement, patient);
        }
    };

    // Med interactions: context menu owned by app.js (jquery-contextmenu, census-wide selector)
    const setupMedicationTaskInteractions = () => {};

    const handleTaskAction = () => {};

    function resolveCensusMode() {
        const key = GameConfig.urlParams?.census || 'census';
        const raw = new URLSearchParams(window.location.search).get(key);
        // full / absent = full pack; minus1 = N-1 no admit; admit* / openAdmit = hold + spawn
        if (
            raw === 'minus1'
            || raw === 'admitStart'
            || raw === 'admitMiddle'
            || raw === 'openAdmit'
        ) {
            return raw;
        }
        return null;
    }

    // Main initialization function — census order from active scenario pack (E4.M1) when present
    const init = async () => {
        try {
            const pack = gameState.getStateSlice('scenarioPack');
            const packIds = Array.isArray(pack?.patients) ? pack.patients : null;
            let ids = packIds
                ? packIds.map((id) => {
                    const cfg = patientConfigs[id];
                    if (!cfg) {
                        throw new Error(`Scenario pack references unknown patient id: ${id}`);
                    }
                    return id;
                })
                : Object.keys(patientConfigs);

            const censusMode = resolveCensusMode();
            let heldPatientId = null;
            if (censusMode && ids.length > 1) {
                heldPatientId = ids[ids.length - 1];
                ids = ids.slice(0, -1);
                gameState.dispatch('SET_ADMIT_HOLD', {
                    heldPatientId,
                    mode: censusMode,
                    spawned: false,
                    findNurseAttempt: 0
                });
            } else if (censusMode && ids.length <= 1) {
                console.warn('Census hold skipped — pack has fewer than 2 patients');
            }

            const configs = ids.map((id) => patientConfigs[id]);
            const patients = await Promise.all(
                configs.map((config) => initializePatient(config))
            );

            const firstId = patients[0]?.id || null;
            if (firstId) {
                gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: firstId });
            }

            panelMode = 'patient';
            renderPatientTabs();
            applyPanelVisibility();
            updateCensusMeta();

            console.log(
                `Initialized ${patients.length} patients (census)`
                + (heldPatientId ? `; held ${heldPatientId} (${censusMode})` : '')
            );
            return patients;
        } catch (error) {
            console.error('Failed to initialize patients:', error);
            throw error;
        }
    };

    // Update patient task statuses declaratively (panel host only — tabs also use data-patient-id)
    const updatePatientTaskStatuses = () => {
        const patients = gameState.getStateSlice('patients');
        if (!patients) return;

        patients.forEach(patient => {
            const patientElement = document.querySelector(
                `.patient-panel-host[data-patient-id="${patient.id}"]`
            );
            if (!patientElement) return;

            const taskElements = patientElement.querySelectorAll('[data-task-type]');
            taskElements.forEach(taskElement => {
                const taskId = taskElement.id;
                const task = gameState.getStateSlice('tasks').get(taskId);
                
                if (task) {
                    // Update task status in DOM (\w+ alone breaks on not-yet / multi-hyphen statuses)
                    taskElement.setAttribute('data-status', task.status);
                    taskElement.className = taskElement.className.replace(/task-status-[\w-]+/g, '').trim();
                    taskElement.classList.add(`task-status-${task.status}`);
                }
            });
        });
        SlotSystem.refreshOccupancyMarkers?.();
        taskSystem.refreshFalloutUi?.();
    };

    // Subscribe to game state changes
    gameState.subscribe('currentTime', () => {
        updatePatientTaskStatuses();
    });
    // Challenge wins can COMPLETE_TASK while paused — sync without waiting for a clock tick
    gameState.subscribe('tasks', () => {
        updatePatientTaskStatuses();
        const patients = gameState.getStateSlice('patients');
        patients?.forEach((p) => syncShiftAssessmentLockAttrs(p.id));
    });

    gameState.subscribe('activePatientId', () => {
        if (panelMode !== 'patient') {
            panelMode = 'patient';
        }
        applyPanelVisibility();
        renderPatientTabs();
    });

    /** Reset main clinical pane scroll when opening a patient or Global. */
    const scrollMainPanelToTop = () => {
        const main = document.querySelector(GameConfig.selectors.main);
        if (main) main.scrollTop = 0;
    };

    /**
     * Open a patient panel. Must apply visibility even when patientId is already
     * active — Global keeps the prior activePatientId, so SET_ACTIVE_PATIENT is a
     * no-op and the activePatientId subscriber would never leave Global (ICU
     * admitStart / N−1 single-census case).
     */
    const showPatientPanel = (patientId, opts = {}) => {
        if (!patientId) return;
        panelMode = 'patient';
        const prev = gameState.getStateSlice('activePatientId');
        if (prev !== patientId) {
            gameState.dispatch('SET_ACTIVE_PATIENT', { patientId });
            // Subscriber applies visibility + tabs when id changes.
        } else {
            applyPanelVisibility();
            renderPatientTabs();
        }
        scrollMainPanelToTop();
        if (opts.logMessage !== false) {
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: opts.logMessage || `Switched to ${patientId}`,
                timeLabel: 'nav'
            });
        }
    };

    /** E10: open Global from Orders/Tools rail (or other chrome). */
    const showGlobalPanel = (opts = {}) => {
        panelMode = 'global';
        applyPanelVisibility();
        renderPatientTabs();
        scrollMainPanelToTop();
        if (opts.logMessage !== false) {
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: opts.logMessage || 'Opened global shift panel',
                timeLabel: 'nav'
            });
        }
    };

    // Public API
    return {
        init,
        initializePatient,
        extractTasksFromHTML,
        renderPatient,
        handleTaskAction,
        showPatientPanel,
        showGlobalPanel,
        
        // Getters
        getPatientConfigs: () => ({ ...patientConfigs }),
        getPatient: (id) => gameState.getStateSlice('patients').get(id),
        applyPanelVisibility,
        renderPatientTabs
    };
})();

export default PatientsModule;