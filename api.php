<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'MusicTheory.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'scales':
        echo json_encode(array_keys(MusicTheory::SCALES));
        break;

    case 'chords':
        echo json_encode(array_keys(MusicTheory::CHORDS));
        break;

    case 'progressions':
        $all = array_merge(
            array_keys(MusicTheory::PROGRESSIONS),
            array_keys(MusicTheory::MELODIC_HOUSE_PROGRESSIONS)
        );
        echo json_encode($all);
        break;

    case 'genres':
        echo json_encode([
            'progressive_house', 'melodic_techno', 'deep_house',
            'organic_house', 'downtempo', 'trance', 'drum_and_bass',
            'minimal_dub_techno', 'peak_time_techno'
        ]);
        break;

    case 'getScale':
        $root  = $_GET['root']  ?? 'A';
        $scale = $_GET['scale'] ?? 'minor';
        $octave = (int)($_GET['octave'] ?? 4);
        echo json_encode(MusicTheory::getScale($root, $scale, $octave));
        break;

    case 'getChord':
        $root     = $_GET['root']  ?? 'A';
        $type     = $_GET['type']  ?? 'minor';
        $octave   = (int)($_GET['octave'] ?? 4);
        $inversion = (int)($_GET['inversion'] ?? 0);
        echo json_encode(MusicTheory::getChord($root, $type, $octave, $inversion));
        break;

    case 'getProgression':
        $key        = $_GET['key']        ?? 'Am';
        $name       = $_GET['progression'] ?? 'vi_IV_I_V';
        $octave     = (int)($_GET['octave'] ?? 4);
        $voiceLead  = isset($_GET['voiceLead']) && $_GET['voiceLead'] === 'true';

        $chords = MusicTheory::getProgression($key, $name, $octave);

        if ($voiceLead) {
            $chords = MusicTheory::voiceLeadProgression($chords);
        }

        echo json_encode($chords);
        break;

    case 'getProgressionForGenre':
        $genre  = $_GET['genre'] ?? 'progressive_house';
        $key    = $_GET['key']   ?? 'Am';
        $octave = (int)($_GET['octave'] ?? 4);

        $progressionName = MusicTheory::getProgressionForGenre($genre);
        $chords = MusicTheory::getProgression($key, $progressionName, $octave);
        $chords = MusicTheory::voiceLeadProgression($chords);

        echo json_encode([
            'progression' => $progressionName,
            'chords' => $chords
        ]);
        break;

    case 'getScaleForGenre':
        $root   = $_GET['root']   ?? 'A';
        $key    = $_GET['key']    ?? 'Am';
        $genre  = $_GET['genre']  ?? 'progressive_house';
        $octave = (int)($_GET['octave'] ?? 4);

        echo json_encode(MusicTheory::getScaleForGenre($root, $key, $genre, $octave));
        break;

    case 'getRelatedKeys':
        $key = $_GET['key'] ?? 'Am';
        echo json_encode(MusicTheory::getRelatedKeys($key));
        break;

    case 'getDropProgression':
        $genre  = $_GET['genre']  ?? 'progressive_house';
        $energy = $_GET['energy'] ?? 'medium';
        $key    = $_GET['key']    ?? 'Am';
        $octave = (int)($_GET['octave'] ?? 4);

        $drop = MusicTheory::getDropProgression($genre, $energy);

        // Resolve chord names to MIDI notes for both sections
        $resolve = function($section) use ($key, $octave) {
            $isMinor = strpos($key, 'm') !== false;
            $root    = str_replace('m', '', $key);
            $result  = [];
            foreach ($section as $degreeInfo) {
                $result[] = MusicTheory::getChord($root, $degreeInfo['type'], $octave);
            }
            return $result;
        };

        echo json_encode([
            'buildup' => $resolve($drop['buildup']),
            'drop'    => $resolve($drop['drop'])
        ]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
}
