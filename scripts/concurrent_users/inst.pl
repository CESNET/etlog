#!/usr/bin/perl -w

use strict;
use Data::Dumper;
use Date::Manip;
use XML::LibXML;
use GPS::Point;
use JSON;
use POSIX;
use utf8;

#               100km/h
my $max_speed = 100*1000/(60*60); # m/s

binmode STDOUT, ":utf8";
binmode STDERR, ":utf8";

sub get_locations {
    my $inst = shift;
    my @loc;

    my $sum_lat = 0;
    my $sum_long = 0;
    my $sum_cnt = 0;

    foreach my $loc (@{$inst->{'location'}}) {
	my $raw = $loc->{coordinates};
	my ($long_f, $lat_f) = split(',', $raw);

	my $point = GPS::Point->new(lat => $lat_f, lon => $long_f);

	push @loc, {raw => $raw,
		    float => [$lat_f, $long_f],
		    point => $point };

	$sum_lat += $lat_f;
	$sum_long += $long_f;
	$sum_cnt++;
    };

    return unless ($sum_cnt);

    my $point = GPS::Point->new(lat => $sum_lat/$sum_cnt,
				lon => $sum_long/$sum_cnt); 
    
    return {
	locations => \@loc,
	centre => { point => $point,
		    float => [ $sum_lat/$sum_cnt,
			       $sum_long/$sum_cnt ]}
    };
};

sub calc_distances {
    my $loc = shift;

    my $cp = $loc->{centre}->{point};

    my $min = undef;
    my $max = undef;
    foreach my $l (@{$loc->{locations}}) {
	my $lp = $l->{point};
        my $dist = $lp->distance($cp);
	$l->{dist} = $dist;

	$min = $dist unless ($min);
	$min = $dist if ($dist < $min);

	$max = $dist unless ($max);
	$max = $dist if ($dist > $max);
    };

    $loc->{centre}->{min} = $min;
    $loc->{centre}->{max} = $max;
};

sub calc_min_dist {
    my $l1 = shift;
    my $l2 = shift;
    my $dist;

    foreach my $a (@{$l1}) {
	foreach my $b (@{$l2}) {
	    my $d = $a->{point}->distance($b->{point});
	    $dist = $d if ((not defined($dist)) or ($dist > $d));
	};
    };

    return $dist;
};

my $inst_file = 'institution.json';
open(F, "<$inst_file") or
    die(sprintf('Failed to open file %s: %s', $inst_file, $!));
my $str = join('', <F>);
close(F);
my $json = from_json($str, {'utf8' => 1});

my %institutions;
my $ts = '2000-01-01T01:00:00Z';

# spocitani vzdalenosti mezi body insituce
foreach my $institution (@{$json->{institutions}->{institution}}) {
    my $inst_realm = @{$institution->{'inst_realm'}}[0];

    my $locations = get_locations($institution);
    $institutions{$inst_realm} = $locations if ($locations);

    if ($ts lt $institution->{'ts'}) {
	$ts = $institution->{'ts'};
    };
};

my %dist;
my @dist;
for my $ir1 (sort keys %institutions) {
    #warn "Working on $ir1";
    my @institutions;
    for my $ir2 (sort keys %institutions) {
	my $dist = calc_min_dist($institutions{$ir1}->{locations},
				 $institutions{$ir2}->{locations});
	my $time = $dist/$max_speed;

	push @institutions, { 'institution' => $ir2,
			      'dist' => POSIX::floor($dist),
			      'time' => POSIX::floor($time)};
    };

    push @dist, { 'institution' => $ir1,
		  'institutions' => \@institutions };

    #last if (scalar(@dist) > 1);
};

my %export = ( revision => UnixDate(ParseDate($ts), '%Y%m%d%H%M%S'),
	       data => \@dist );

my $json_out = encode_json \%export;

open(JSON, ">inst.json");
print JSON $json_out;
close(JSON);

# tidy json: python -mjson.tool
